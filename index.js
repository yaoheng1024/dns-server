const CustomHostManager = require("./src/customHostManager");
const { getCustomArgs, getIPaddress } = require('./src/helpers');
const { getResponseBuffer, parseRequestBuffer } = require('./lib/dns-proxy-server/index');

const dgram = require("dgram");
const dns = require("dns");
// https://www.ietf.org/rfc/rfc1035.txt
// https://cabulous.medium.com/dns-message-how-to-read-query-and-response-message-cfebcb4fe817
// https://jvns.ca/blog/2022/11/06/making-a-dns-query-in-ruby-from-scratch/
// dns-packet 解析
exports.setupServer = async function setupServer() {
    
  const args = getCustomArgs();
  const ipAddr = (args.i && args.i[0]) || getIPaddress();
  const port = (args.p && args.p[0]) || 53;
  const hostFilePath = (args.h && args.h[0]);
  let customHostManager;
  if (hostFilePath) {
     customHostManager = new CustomHostManager();
    await customHostManager.parseHostFromPath(hostFilePath);
  }
  const server = dgram.createSocket("udp4");
  server.on("message", function (msg, rinfo) {
    const clientAddr = rinfo.address || rinfo.host;
    const clientPort = rinfo.port;
    const request = parseRequestBuffer(msg);
    const { domain } = request;

    function response(addresses, ttl = 1) {
      const responseBuf = getResponseBuffer(request, ttl, addresses);
      server.send(responseBuf, clientPort, clientAddr);
      console.log(`${domain} ${addresses}`);
    }
    if (customHostManager && customHostManager.hasDomainIpAddress(domain)) {
      const ip = customHostManager.getDomainIpAddress(domain);
      response(ip);
    } else {
      dns.lookup(domain, function (err, address, family) {
        if (address) {
          response(address);
        } else {
          dns.resolve4(domain, function (error, addresses) {
            console.log("dns resolve4 server...");
            if (!addresses) {
              return console.log("missing...", domain);
            }
            response(addresses, 30);
          });
        }
      });
    }
  });
  server.on("error", function (err) {
    console.log("server error: ", err.stack);
  });
  server.on("listening", function () {
    const address = server.address();
    console.log("server listening: ", address.address, ":", address.port);
  });
  server.bind({ port: port || 53, address: ipAddr });
}
