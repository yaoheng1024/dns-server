const CustomHostManager = require("./src/customHostManager");
const { getCustomArgs, getIPaddress } = require('./src/helpers');
const dnsPacket = require('dns-packet');

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
  server.send
  server.on("message", function (msg, rinfo) {
    console.log(rinfo);
    const clientAddr = rinfo.address || rinfo.host;
    const clientPort = rinfo.port;
    const request = dnsPacket.decode(msg);
    const domain = request.questions[0].name;
    if (customHostManager && customHostManager.hasDomainIpAddress(domain)) {
      
    } else {
      dns.lookup(domain, function (err, address, family) {
        if (address) {
          console.log("address: ", address, rq.domain);
          return rs(rq, 1, address);
        } else {
          dns.resolve4(domain, function (error, addresses) {
            console.log("dns resolve4 server...");
            if (addresses) {
              return console.log("missing...", rq.domain);
            }
            console.log("address[net]: ", addresses, rq.domain);
            return rs(rq, 30, addresses);
          });
        }
      });
    }
    // {
    //   id: 36668,
    //   type: 'query',
    //   flags: 256,
    //   flag_qr: false,
    //   opcode: 'QUERY',
    //   flag_aa: false,
    //   flag_tc: false,
    //   flag_rd: true,
    //   flag_ra: false,
    //   flag_z: false,
    //   flag_ad: false,
    //   flag_cd: false,
    //   rcode: 'NOERROR',
    //   questions: [ { name: 'resolver.msg.xiaomi.net', type: 'A', class: 'IN' } ],
    //   answers: [],
    //   authorities: [],
    //   additionals: []
    // }
    // const rq = request(msg),
    //   rs = respond(rinfo);
    
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


