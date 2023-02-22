const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

exports.handler = function (event, context, callback) {
    Number.prototype.formatBytes = function() {
        var units = ['B', 'KB', 'MB', 'GB', 'TB'],
            bytes = this,
            i;
     
        for (i = 0; bytes >= 1024 && i < 4; i++) {
            bytes /= 1024;
        }
     
        return bytes.toFixed(2) +" "+ units[i];
    }
    var urlPath = fileName = '';

    if (event.requestContext.http.path != '') urlPath = event.requestContext.http.path;

    const directoryPath = __dirname+'/mnt' + urlPath;

    if(event.queryStringParameters) {
        fileName = event.queryStringParameters.fileName;
        if(fileName!=='') {
            const filePath = path.join(directoryPath, fileName);
            if(fs.existsSync(filePath)){
                const fileExtension = path.extname(fileName);
                let fileType = mime.contentType(fileExtension);
                const HEADER = { 'Content-Type':fileType,'Content-Disposition': 'attachment; filename='+fileName};
                const fileStream = fs.createReadStream(filePath);
                callback(null, {
                    statusCode: 200,
                    headers: HEADER,
                    body: fileStream,
                });
            }else{
                callback(null, {
                    statusCode: 404,
                    body: "File not found"
                });
            }
        }
    }else{

        const files = fs.readdirSync(directoryPath);
        let parentDir = path.dirname(urlPath);
    
        let html = `<html>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                        <body><h1>Index of /mnt/access${urlPath}</h1>
                        <style>
                        table, th, td {
                          border: 1px solid black;
                          border-collapse: collapse;
                          padding : 5px;
                        }
                        </style>
                        <table>
                            <tr>
                            <th><i class="fa fa-list"></i> </th>
                            <th><a href="#?C=N;O=D">Name</a></th>
                            <th><a href="#?C=M;O=A">Last modified</a></th>
                            <th><a href="#?C=S;O=A">Size</a></th>
                            <th><a href="#?C=D;O=A">Description</a></th>
                        </tr>`;
        if (directoryPath != __dirname+'/mnt') {
            html += `<tr>
                                    <td valign="top"><i class="fa fa-home"></i> </td>
                                    <td colspan="4"><a href="${parentDir}">Parent Directory</a></td>
                                </tr>`;
        }
        if (files.length == 0) {
            html += `<tr>
                                    <td colspan="5">Dir is Empty :(</td>
                                </tr>`;
        } else {
            var count = 1;
            files.forEach(function (file) {
                let item_path = path.join(directoryPath, file);
                let stats = fs.statSync(item_path);
                let createdDate = new Date(stats.birthtime);
                let modifiedDate = new Date(stats.mtime);
                let fileSize = stats.size;
                
                if (fs.lstatSync(item_path).isDirectory()) {
                    
                    html += `<tr>
                                                <td valign="top"><i class="fa fa-folder"></i> </td>
                                                <td><a class="downloadFile" href="${file}/">${file}</a></td>
                                                <td align="right">${modifiedDate.toLocaleString()}</td>
                                                <td align="right">${fileSize.formatBytes()} </td>
                                                <td>&nbsp;</td>
                                            </tr>`;
                } else {
                    html += `<tr>
                                                <td valign="top">${count++} <i class="fa fa-file"></i> </td>
                                                <td><a class="downloadFile" href="?action=downloadFile&fileName=${file}">${file}</a></td>
                                                <td align="right"> ${modifiedDate.toLocaleString()}</td>
                                                <td align="right"> ${fileSize.formatBytes()} </td>
                                                <td>&nbsp;</td>
                                            </tr>`;
                }
            });
        }
        html += "</table></body></html>"
        callback(null, {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html
        });
    }
};
