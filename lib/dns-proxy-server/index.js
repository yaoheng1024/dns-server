'use strict';
/**
 * from https://github.com/Yi-love/dns-proxy-server
 * @author Yi-love  
 * with 
 * MIT License

    Copyright (c) 2016 Yi

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
 */

var numify = function (ip) {
    ip = ip.split(".").map(function (n) {
        return parseInt(n, 10);
    });

    var result = 0,
        base = 1;

    for (var i = ip.length - 1; i >= 0; i--) {
        result += ip[i] * base;
        base *= 256;
    }
    // result = ip[0]*(1<<24) + ip[1]*(1<<16) + ip[2]*(1<<8) + ip[3];
    return result;
};

var responseBuffer = function (response) {
    var offset = response.question.qname.length,
        length = 16 + offset;

    for (var i = 0; i < response.answer.length; i++) {
        length += 14 + response.answer[i].name.length;
    }

    var buf = Buffer.alloc(length);
    response.header.id.copy(buf, 0, 0, 2);

    buf[2] =
        0x00 |
        (response.header.qr << 7) |
        (response.header.opcode << 3) |
        (response.header.aa << 2) |
        (response.header.tc << 1) |
        response.header.rd;
    buf[3] = 0x00 | (response.header.ra << 7) | (response.header.z << 4) | response.header.rcode;

    buf.writeUInt16BE(response.header.qdcount, 4);
    buf.writeUInt16BE(response.header.ancount, 6);
    buf.writeUInt16BE(response.header.nscount, 8);
    buf.writeUInt16BE(response.header.arcount, 10);

    response.question.qname.copy(buf, 12);
    response.question.qtype.copy(buf, 12 + offset, 0, 2);
    response.question.qclass.copy(buf, 14 + offset, 0, 2);

    offset += 16;

    for (i = 0; i < response.answer.length; i++) {
        response.answer[i].name.copy(buf, offset);

        offset += response.answer[i].name.length;

        buf.writeUInt16BE(response.answer[i].type, offset);
        buf.writeUInt16BE(response.answer[i].class, offset + 2);
        buf.writeUInt32BE(response.answer[i].ttl, offset + 4);
        buf.writeUInt16BE(response.answer[i].rdlength, offset + 8);
        buf.writeUInt32BE(response.answer[i].rdata, offset + 10);

        offset += 14;
    }

    return buf;
};
var resolve = function (qname, ttl, rdata) {
    var result = [];
    for (var i = 0; i < rdata.length; i++) {
        var answer = {};
        answer.name = qname;
        answer.type = 1;
        answer.class = 1;
        answer.ttl = ttl;
        answer.rdlength = 4;
        answer.rdata = numify(rdata[i]);
        result.push(answer);
    }
    return result;
};
var bitSlice = function (b, offset, length) {
    return (b >>> (7 - (offset + length - 1))) & ~(0xff << length);
};

var domainify = function (qname) {
    var parts = [];

    for (var i = 0; i < qname.length && qname[i]; ) {
        var length = qname[i],
            offset = i + 1;
        parts.push(qname.slice(offset, offset + length).toString());
        i = offset + length;
    }

    return parts.join(".");
};

exports.parseRequestBuffer = function request(buf) {
    var header = {},
        question = {},
        b = buf.slice(2, 3).toString("binary", 0, 1).charCodeAt(0);

    header.id = buf.slice(0, 2);
    header.qr = bitSlice(b, 0, 1);
    header.opcode = bitSlice(b, 1, 4);
    header.aa = bitSlice(b, 5, 1);
    header.tc = bitSlice(b, 6, 1);
    header.rd = bitSlice(b, 7, 1);

    b = buf.slice(3, 4).toString("binary", 0, 1).charCodeAt(0);

    header.ra = bitSlice(b, 0, 1);
    header.z = bitSlice(b, 1, 3);
    header.rcode = bitSlice(b, 4, 4);

    header.qdcount = buf.slice(4, 6);
    header.ancount = buf.slice(6, 8);
    header.nscount = buf.slice(8, 10);
    header.arcount = buf.slice(10, 12);

    question.qname = buf.slice(12, buf.length - 4);
    question.qtype = buf.slice(buf.length - 4, buf.length - 2);
    question.qclass = buf.slice(buf.length - 2, buf.length);

    return { header: header, question: question, domain: domainify(question.qname) };
};

exports.getResponseBuffer = function response(request, ttl, rdata) {
    var response = {};
    response.header = {};
    response.question = {};
    response.answer = resolve(request.question.qname, ttl, typeof rdata === "string" ? [rdata] : rdata);

    response.header.id = request.header.id;

    response.header.qr = 1;
    response.header.opcode = 0;
    response.header.aa = 0;
    response.header.tc = 0;
    response.header.rd = 1;
    response.header.ra = 0;
    response.header.z = 0;
    response.header.rcode = 0;
    response.header.qdcount = 1;
    response.header.ancount = response.answer.length;
    response.header.nscount = 0;
    response.header.arcount = 0;

    response.question.qname = request.question.qname;
    response.question.qtype = request.question.qtype;
    response.question.qclass = request.question.qclass;
    return responseBuffer(response);
};
