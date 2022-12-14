function getCustomArgs() {
  const extraArgs = process.argv.slice(2);
  const args = {};
  let currentKey;
  extraArgs.forEach((arg) => {
    if (arg.startsWith("-")) {
      currentKey = arg.substring(1);
      args[currentKey] = [];
    } else if (currentKey) {
      args[currentKey].push(arg);
    } else {
      console.error("unknown arg: " + arg);
    }
  });
  return args;
}

function getIPaddress() {
  let ip;
  const networkInfo = os.networkInterfaces();
  for (const key in networkInfo) {
    const networkCardInfos = networkInfo[key];
    networkCardInfos.find((info) => {
      if (info.family === "IPv4") {
        ip = info.address;
        return true;
      }
    });
    if (ip) {
      break;
    }
  }
  return ip;
}
