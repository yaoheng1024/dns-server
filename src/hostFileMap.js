const fs = require("fs");
const path = require("path");
const readline = require("readline");

const hostMap = new Map();

const filesInDir = fs.readdirSync(path, { encoding: 'utf-8', withFileTypes: true });

function checkIsFile(path) {
   return fs.statSync(path).isFile;
}

function parseHostFile(filePath) {
    return new Promise(resolve => {
        if (!filePath.endsWith(".txt")) {
            console.error(`file ${filePath} is not a .txt file`);
            resolve();
            return;
        }
        console.log('processing ' + filePath);

        const readStream = fs.createReadStream(filePath, "utf-8");
        const rl = readline.createInterface({
            input: readStream,
            output: process.stdout,
            terminal: false,
        });
        rl.on("line", parseHostLine);
        readStream.on("end", () => {
            resolve();
        });
    });
}

function parseHostLine(lineStr) {
    lineStr = lineStr.trim();
    if (lineStr.startsWith('#')) {
        // is comment
        return;
    }
    let ipAddr;
    lineStr.split(/\s+/).forEach((domain, index) => {
        if (index === 0) {
            ipAddr = domain;
        } else {
            hostMap.set(domain, ipAddr);
        }
    });
}
parseHostFile(path.resolve("../host.txt")).then(() => {
    console.log(hostMap.entries());
});