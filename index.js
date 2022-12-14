const dgram = require("dgram");
const dns = require("dns");
// https://www.ietf.org/rfc/rfc1035.txt
// https://cabulous.medium.com/dns-message-how-to-read-query-and-response-message-cfebcb4fe817
// https://jvns.ca/blog/2022/11/06/making-a-dns-query-in-ruby-from-scratch/
// dns-packet 解析
export function setupServer(params) {
    
  const args = getCustomArgs();
  const ipAddr = (args.i && args.i[0]) || getIPaddress();
  const port = (args.p && args.p[0]) || 53;
  const server = dgram.createSocket("udp4");

  server.on("message", function (msg, rinfo) {
    // const rq = request(msg),
    //   rs = respond(rinfo);
    // dns.lookup(rq.domain, function (err, address, family) {
    //   if (address !== void 0) {
    //     console.log("address: ", address, rq.domain);
    //     return rs(rq, 1, address);
    //   } else {
    //     dns.resolve4(rq.domain, function (error, addresses) {
    //       console.log("dns resolve4 server...");
    //       if (addresses === void 0) {
    //         return console.log("missing...", rq.domain);
    //       }
    //       console.log("address[net]: ", addresses, rq.domain);
    //       return rs(rq, 30, addresses);
    //     });
    //   }
    // });
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
setupServer();


