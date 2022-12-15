const fs = require("fs");
const path = require("path");
const readline = require("readline");

module.exports = class CustomHostManger {
    cacheMap = new Map();
    constructor() {
        this.parseHostLine = this.parseHostLine.bind(this);
        this.parseHostFromPath = this.parseHostFromPath.bind(this);
        this.parseHostFile = this.parseHostFile.bind(this);
    }

    hasDomainIpAddress(domain) {
        return this.cacheMap.has(domain);
    }

    getDomainIpAddress(domain) {
        return this.cacheMap.get(domain);
    }

    parseHostFromPath(pathParam) {
        if (fs.statSync(pathParam).isFile()) {
            return this.parseHostFile(pathParam);
        } else {
            const filesInDir = fs.readdirSync(pathParam, { encoding: 'utf-8', withFileTypes: true });
            const promises = filesInDir.map(info => {
                if (info.isFile()) {
                    return this.parseHostFile(path.resolve(pathParam, info.name));
                }
                return Promise.resolve();
            });
            return Promise.all(promises);
        }
    }

    parseHostFile(filePath) {
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
            rl.on("line", this.parseHostLine);
            readStream.on("end", () => {
                resolve();
            });
        });
    }

    parseHostLine(lineStr) {
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
                this.cacheMap.set(domain, ipAddr);
            }
        });
    }
}
const hostMap = new Map();