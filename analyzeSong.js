"use strict";

/** @type {AudioBuffer} */
let audioLoaded = null;
let audioData = {
    duration: null,
    beatDetectTime: null,
    beatDetectRespectively: null
};

function audioAccepted(file, t) {
    let reader = new FileReader();
    
    reader.addEventListener("load", function () {
        // to data
        const audioContext = new AudioContext()
        audioContext.decodeAudioData(reader.result, function(arrayBuffer) {
            audioLoaded = arrayBuffer;
            audioData.duration = arrayBuffer.duration;
            analyzeSong();
        });
    }, false);

    if (file) {
        reader.readAsArrayBuffer(file);
    }
}


function analyzeSong() {
    const channelToanAnalyze = [...audioLoaded.getChannelData(0)];
    const perDt = (Math.max(document.getElementsByName("analyzeTick")[0].value, 0.001) || 0.1)*1000;
    const per = Math.floor(channelToanAnalyze.length/audioData.duration*perDt/1000);
    let skippedData = [];
    for (let i = 0, l = channelToanAnalyze.length/per; i < l; i++) {
        skippedData.push(channelToanAnalyze.slice(per*i, per*(i+1)).reduce((a, b) => a = Math.max(a, b), 0));
    }

    audioData.beatDetectTime = [];
    audioData.beatDetectRespectively = [];
    let lastData = 0;
    let scanningPeak = -1;
    let min = -1;
    for (let i = 0, l = skippedData.length; i < l; i++) {
        if (skippedData[i] > lastData && skippedData[i] > 0.1 && skippedData[i] > min+0.1) {
            scanningPeak = i;
        } else if (scanningPeak !== -1) {
            audioData.beatDetectTime.push(Math.floor(perDt*scanningPeak));
            audioData.beatDetectRespectively.push(skippedData[scanningPeak]);
            min = skippedData[scanningPeak];
            scanningPeak = -1;
        } else {
            min = Math.min(min, skippedData[i]);
        }
        lastData = skippedData[i];
    }

    generateMap(audioData.beatDetectTime);
}
