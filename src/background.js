var list = [];

var status = "";

function startBrowsingCapture() {
    if (!browser.history.onTitleChanged.hasListener(capture)) {
        browser.history.onTitleChanged.addListener(capture);
        status = "STARTED";
        console.log(Date().toLocaleString() + " starting");
    }
}

function stopBrowsingCapture() {
    if (browser.history.onTitleChanged.hasListener(capture)) {
        browser.history.onTitleChanged.removeListener(capture);
        status = "STOPPED";
        console.log(Date().toLocaleString() + " stopping");
    }

    downloadBrowsingHistory();
}

function downloadBrowsingHistory() {

    if (list.length === 0) {
        console.log("empty browsing list - not saving anything !");

    } else {
        saveData(list);
        console.log("browsing list saved");
    }
}


function capture(HistoryItem) {
    let dateISO = new Date();
    console.log("Website opened");
    console.log(dateISO.toISOString());
    console.log(HistoryItem.url);
    console.log(HistoryItem.title);

    const temp = {
        date: dateISO.toISOString(),
        url: HistoryItem.url,
        title: HistoryItem.title
    }

    list.push(temp);
}


function getMessage() {
    if (!browser.runtime.onMessage.hasListener(processMessage)) {
        browser.runtime.onMessage.addListener(processMessage);
    }
}

function stopMessage() {
    if (browser.runtime.onMessage.hasListener(processMessage)) {
        browser.runtime.onMessage.removeListener(processMessage);
    }
}

function processMessage(data, sender) {
    console.log("MSG Copy " + data.content);

    if (data.content === '#start') {
        startBrowsingCapture();
        return Promise.resolve({response: "done"});
    }

    if (data.content === '#stop') {
        stopBrowsingCapture();

        return Promise.resolve({response: "done"});
    }

    if (data.content === '#status') {
        return Promise.resolve({response: status});
    }

    if (data.content === '#download') {
        downloadBrowsingHistory();
        return Promise.resolve({response: "done"});
    }

    return Promise.resolve({response: "error"});
}

function dateFile() {
    let dateUTC = new Date();
    let dateString = dateUTC.getUTCFullYear() + "-" + (dateUTC.getUTCMonth() + 1) + "-" + dateUTC.getUTCDate() + "_" +
        dateUTC.getUTCHours() + "-" + dateUTC.getUTCMinutes() + "-" + dateUTC.getUTCSeconds();
    return dateString;
}


function saveData(data) {
    let blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    let url = URL.createObjectURL(blob);
    let dateString = "regis-browser-history/" + dateFile() + ".txt";
    let download = browser.downloads.download({url: url, filename: dateString, saveAs: false});
    download.then(() => {
        list = []
    }).catch(error => console.log(error));
}


function init() {
    startBrowsingCapture();
    getMessage();

    browser.windows.onRemoved.addListener(() => {
        downloadBrowsingHistory()
    });

    setInterval(downloadBrowsingHistory,1200000); // every 20 minutes

}


init();