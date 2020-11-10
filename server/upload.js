const fs = require('fs');

var files = {};

let UploadProcess = (socket) => {
    /* event to get the file and be ready for upload */
    socket.on('Start', (data) => {
        let fileName = data['fileName'];

        files[fileName] = {
            fileSize: data['size'],
            data: "",
            downloaded: 0
        }

        let startingRange = 0;

        //It's a New File
        fs.open(`./uploadedFile/${fileName}`, "a", 0755, (err, fd) => {
            if (err) {
                console.log(err);
            } else {
                files[fileName]['handler'] = fd; //We store the file handler so we can write to it later
                socket.emit('MoreData', {
                    'startingRange': startingRange,
                    percent: 0
                });
            }
        });
    });

    /* to start upload event */
    socket.on('Upload', (data) => {
        let fileName = data['fileName'];
        files[fileName]['downloaded'] += data['data'].length;
        files[fileName]['data'] += data['data'];

        if (files[fileName]['downloaded'] == files[fileName]['fileSize']) //If File is Fully Uploaded
        {
            socket.emit('Done', {
                "loaded": files[fileName]['downloaded']
            });
            files = {};
        } else if (files[fileName]['data'].length > 10485760) { //If the data Buffer reaches 10MB
            fs.write(files[fileName]['handler'], files[fileName]['data'], null, 'Binary', (err, Writen) => {
                files[fileName]['data'] = ""; //Reset The Buffer
                let startingRange = files[fileName]['downloaded'] / 50000;
                let percent = (files[fileName]['downloaded'] / files[fileName]['fileSize']) * 100;
                socket.emit('MoreData', {
                    'startingRange': startingRange,
                    'percent': percent,
                    "loaded": files[fileName]['downloaded']
                });
            });
        } else {
            let startingRange = files[fileName]['downloaded'] / 50000;
            let percent = (files[fileName]['downloaded'] / files[fileName]['fileSize']) * 100;
            socket.emit('MoreData', {
                'startingRange': startingRange,
                'percent': percent,
                "loaded": files[fileName]['downloaded']
            });
        }
    });

    /* to resume paused upload */
    socket.on('Resume', (data) => {
        socket.emit('MoreData', {
            'startingRange': data["startingRange"],
            'percent': data["percent"],
            "loaded": data["loaded"]
        });
    });
}

module.exports = UploadProcess;