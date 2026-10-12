// https://stackoverflow.com/questions/54932711/display-and-play-audio-file-selected-in-input-javascript
//https://stackoverflow.com/questions/6455631/listening-console-log

let context = new AudioContext();
let tuna = new Tuna(context);

let activeEffects = [];
let activeFilters = [];

let decodedBuffer = null;   
let currentSource = null;   
let isPlaying = false;

let startTime = 0;          
let pauseOffset = 0;        

let file = null;


(function(){

    var originallog = console.log;
    var originalwarn = console.warn

    console.log = function(txt) {
        
        document.getElementById("logs").innerHTML += "<br>" + txt + "<br>"

        originallog.apply(console, arguments);
    }
    console.warn = function(txt) {
        
        document.getElementById("logs").innerHTML += "<br>" + txt + "<br>"

        originalwarn.apply(console, arguments);
    }

})();


function play() {
    if (!decodedBuffer) {
        console.warn("Audio not ready yet (call apply() first).");
        return;
    }
    if (isPlaying) {
        return;
    }

    createAndStartSource(pauseOffset);
}

function pauseAudio() {
    if (!isPlaying || !currentSource) return;

    const elapsed = context.currentTime - startTime;
    pauseOffset += elapsed;

    try { currentSource.stop(); } catch (e) {}
    currentSource = null;
    isPlaying = false;

    console.log(`Paused at ${pauseOffset.toFixed(2)}s`);
}

function restartAudio() {
    if (!decodedBuffer) return;

    // Always stop any existing playback
    if (currentSource) {
        try { currentSource.stop(); } catch (e) {}
        currentSource = null;
    }

    pauseOffset = 0;
    isPlaying = false;

    createAndStartSource(0);
}

function apply() {
    file = document.getElementById("inputFile").files[0];
    if (!file) { 
        return console.log("Please submit a valid audio file");
    }
    
    const delayEnabled = document.getElementById("effect1").checked;
    const chorusEnabled = document.getElementById("effect2").checked;
    const compressorEnabled = document.getElementById("effect3").checked;
    const bitcrusherEnabled = document.getElementById("effect4").checked;
    const phaserEnabled = document.getElementById("effect5").checked;

    // David Part start
    const LPF_enabled = document.getElementById("filterLPF").checked
    const HPF_enabled = document.getElementById("filterHPF").checked
    const BPF_enabled = document.getElementById("filterBPF").checked
    const Notch_enabled = document.getElementById("filterNotch").checked
    const Peak_enabled = document.getElementById("filterPeak").checked
    const LowShelf_enabled = document.getElementById("filterLowShelf").checked
    const HighShelf_enabled = document.getElementById("filterHighShelf").checked
    const AllPass_enabled = document.getElementById("filterAllPass").checked
    const WahWah_enabled = document.getElementById("filterWahWah").checked
    const Moog_enabled = document.getElementById("filterMoog").checked

    if (isPlaying && currentSource) {
        const elapsed = context.currentTime - startTime;
        pauseOffset += elapsed;
        try { currentSource.stop(); } catch (e) {}
        isPlaying = false;
        currentSource = null;
    }
    
    activeEffects = [];
    activeFilters = [] 

    if (delayEnabled) {
        const feedback = document.getElementById("delayFeedback").value / 100; // Convert to 0-1 range
        const delayTime = parseInt(document.getElementById("delayTime").value);
        const wetLevel = document.getElementById("delayWetLevel").value / 100; // Convert to 0-1 range
        
        var delay = new tuna.Delay({
            feedback: feedback,
            delayTime: delayTime,
            wetLevel: wetLevel,
            dryLevel: 1,
            cutoff: 20000,
            bypass: false
        });
        activeEffects.push(delay);
        console.log(`Delay applied - Feedback: ${feedback}, DelayTime: ${delayTime}ms, WetLevel: ${wetLevel}`);
    }
    
    if (chorusEnabled) {
        const rate = parseFloat(document.getElementById("chorusRate").value);
        const feedback = document.getElementById("chorusFeedback").value / 100; // Convert to 0-1 range
        const delayMs = parseFloat(document.getElementById("chorusDelay").value) / 1000; // Convert to seconds
        
        var chorus = new tuna.Chorus({
            rate: rate,
            feedback: feedback,
            delay: delayMs,
            bypass: false
        });
        activeEffects.push(chorus);
        console.log(`Chorus applied - Rate: ${rate}, Feedback: ${feedback}, Delay: ${delayMs}s`);
    }
    
    if (compressorEnabled) {
        const threshold = parseInt(document.getElementById("compressorThreshold").value);
        const makeupGain = parseInt(document.getElementById("compressorMakeup").value);
        const ratio = parseInt(document.getElementById("compressorRatio").value);
        
        var compressor = new tuna.Compressor({
            threshold: threshold,
            makeupGain: makeupGain,
            attack: 1,
            release: 250,
            ratio: ratio,
            knee: 5,
            automakeup: false,
            bypass: false
        });
        activeEffects.push(compressor);
        console.log(`Compressor applied - Threshold: ${threshold}dB, Makeup: ${makeupGain}dB, Ratio: ${ratio}`);
    }
    
    if (bitcrusherEnabled) {
        const bits = parseInt(document.getElementById("bitcrusherBits").value);
        const normfreq = document.getElementById("bitcrusherFreq").value / 100; // Convert to 0-1 range
        
        var bitcrusher = new tuna.Bitcrusher({
            bits: bits,
            normfreq: normfreq,
            bufferSize: 4096
        });
        activeEffects.push(bitcrusher);
        console.log(`Bitcrusher applied - Bits: ${bits}, Frequency: ${normfreq}`);
    }
    
    if (phaserEnabled) {
        const rate = parseFloat(document.getElementById("phaserRate").value);
        const depth = document.getElementById("phaserDepth").value / 100; // Convert to 0-1 range
        const feedback = document.getElementById("phaserFeedback").value / 100; // Convert to 0-1 range
        
        var phaser = new tuna.Phaser({
            rate: rate,
            depth: depth,
            feedback: feedback,
            stereoPhase: 40,
            baseModulationFrequency: 700,
            bypass: false
        });
        activeEffects.push(phaser);
        console.log(`Phaser applied - Rate: ${rate}, Depth: ${depth}, Feedback: ${feedback}`);
    }
    // Low pass
    if (LPF_enabled) {
        let f = context.createBiquadFilter()
        f.type = "lowpass"
        f.frequency.value = document.getElementById("LPFfreq").value
        f.Q.value = document.getElementById("LPFQ").value
        activeFilters.push(f)
    }
    // High-pass
    if (HPF_enabled) {
        let f = context.createBiquadFilter()
        f.type = "highpass"
        f.frequency.value = document.getElementById("HPFfreq").value
        f.Q.value = document.getElementById("HPFQ").value
        activeFilters.push(f)
    }
    // Band pass
    if (BPF_enabled) {
        let f = context.createBiquadFilter()
        f.type = "bandpass"
        f.frequency.value = document.getElementById("BPFfreq").value
        f.Q.value = document.getElementById("BPFQ").value
        activeFilters.push(f)
    }
    // Notch filter
    if (Notch_enabled) {
        let f = context.createBiquadFilter()
        f.type = "notch"
        f.frequency.value = document.getElementById("Notchfreq").value
        f.Q.value = document.getElementById("NotchQ").value
        activeFilters.push(f)
    } 
    // Peaking EQ band filter
    if (Peak_enabled) {
        let f = context.createBiquadFilter()
        f.type = "peaking"
        f.frequency.value = document.getElementById("Peakfreq").value
        f.Q.value = document.getElementById("PeakQ").value
        f.gain.value = document.getElementById("PeakGain").value
        activeFilters.push(f)
    }
    // Low Shelf filter
    if (LowShelf_enabled) {
        let f = context.createBiquadFilter()
        f.type = "lowshelf"
        f.frequency.value = document.getElementById("LowShelffreq").value
        f.Q.value = document.getElementById("LowShelfQ").value
        f.gain.value = document.getElementById("LowShelfGain").value
        activeFilters.push(f)
    }
    // High Shelf filter
    if (HighShelf_enabled) {
        let f = context.createBiquadFilter()
        f.type = "highshelf"
        f.frequency.value = document.getElementById("HighShelffreq").value
        f.Q.value = document.getElementById("HighShelfQ").value
        f.gain.value = document.getElementById("HighShelfGain").value
        activeFilters.push(f)
    }
    // All Pass filter
    if (AllPass_enabled) {
        let f = context.createBiquadFilter()
        f.type = "allpass"
        f.frequency.value = document.getElementById("AllPassfreq").value
        f.Q.value = document.getElementById("AllPassQ").value
        f.gain.value = document.getElementById("AllPassGain").value
        activeFilters.push(f)
    }
    // WahWah filter
    if (WahWah_enabled) {
        let wah = new tuna.WahWah({
            automode: true,
            baseFrequency: parseFloat(document.getElementById("WahWahfreq").value),
            excursionOctaves: parseFloat(document.getElementById("WahWahOctaves").value),
            sweep: parseFloat(document.getElementById("WahWahSweep").value),
            resonance: parseFloat(document.getElementById("WahWahResonance").value),
            sensitivity: parseFloat(document.getElementById("WahWahSensitivity").value),
            bypass: false
        })
        activeFilters.push(wah)
        console.log(`WahWah applied - BaseFreq: ${wah.baseFrequency}, Octaves: ${wah.excursionOctaves}, Sweep: ${wah.sweep}, Resonance: ${wah.resonance}, Sensitivity: ${wah.sensitivity}`)
    }
    // Moog filter
    if (Moog_enabled) {
        let moog = new tuna.MoogFilter({
            cutoff: parseFloat(document.getElementById("MoogCutoff").value),
            resonance: parseFloat(document.getElementById("MoogResonance").value),
            bufferSize: parseInt(document.getElementById("MoogBufferSize").value),
            bypass: false
        });

        activeFilters.push(moog);

        console.log(`Moog Filter applied - Cutoff: ${moog.cutoff}, Resonance: ${moog.resonance}, BufferSize: ${moog.bufferSize}`);
    }
    
    if (activeEffects.length === 0) {
        console.log("No effects selected. Please select at least one effect.");
    }

    if (activeFilters.length === 0) {
        console.log("No filters selected. Please select at least one filters.");
    }
    
    if (!decodedBuffer) {
        file.arrayBuffer()
            .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                decodedBuffer = audioBuffer;
                console.log(`Processed audio with ${activeEffects.length} effect(s) and ${activeFilters.length} filter(s`);
            })
            .catch(err => console.error("Error processing audio:", err));
    } else {
        // already decoded -> just rebuild chain with new effects/filters
        console.log(`Re-applied processing with ${activeEffects.length} effect(s) and ${activeFilters.length} filter(s`);
    }
}

function createAndStartSource(offsetSeconds = 0) {
    if (!decodedBuffer) {
        console.warn("No decoded audio to play.");
        return;
    }

    // Stop old source if it exists
    if (currentSource) {
        try { currentSource.stop(); } catch (e) {}
        currentSource = null;
    }

    const source = context.createBufferSource();
    source.buffer = decodedBuffer;

    let currentNode = source;

    // Chain effects
    for (let i = 0; i < activeEffects.length; i++) {
        currentNode.connect(activeEffects[i]);
        currentNode = activeEffects[i];
    }

    // Chain filters
    for (let i = 0; i < activeFilters.length; i++) {
        currentNode.connect(activeFilters[i]);
        currentNode = activeFilters[i];
    }

    // Output
    currentNode.connect(context.destination);

    startTime = context.currentTime - offsetSeconds;
    source.start(0, offsetSeconds);
    isPlaying = true;
    currentSource = source;

    source.onended = () => {
        // If it ended naturally
        if (!isPlaying) return;
        isPlaying = false;
        currentSource = null;
        pauseOffset = 0;
    };

    console.log(`Playing from ${offsetSeconds.toFixed(2)}s`);
}

document.addEventListener('DOMContentLoaded', function() {
    // Delay effect sliders
    const delayFeedback = document.getElementById("delayFeedback");
    const delayTime = document.getElementById("delayTime");
    const delayWetLevel = document.getElementById("delayWetLevel");
    
    if (delayFeedback) {
        document.getElementById("delayFeedbackOutput").innerHTML = delayFeedback.value;
        delayFeedback.oninput = function() {
            document.getElementById("delayFeedbackOutput").innerHTML = this.value;
        }
    }
    
    if (delayTime) {
        document.getElementById("delayTimeOutput").innerHTML = delayTime.value;
        delayTime.oninput = function() {
            document.getElementById("delayTimeOutput").innerHTML = this.value;
        }
    }
    
    if (delayWetLevel) {
        document.getElementById("delayWetLevelOutput").innerHTML = delayWetLevel.value;
        delayWetLevel.oninput = function() {
            document.getElementById("delayWetLevelOutput").innerHTML = this.value;
        }
    }

    // Chorus effect sliders
    const chorusRate = document.getElementById("chorusRate");
    const chorusFeedback = document.getElementById("chorusFeedback");
    const chorusDelay = document.getElementById("chorusDelay");
    
    if (chorusRate) {
        document.getElementById("chorusRateOutput").innerHTML = chorusRate.value;
        chorusRate.oninput = function() {
            document.getElementById("chorusRateOutput").innerHTML = this.value;
        }
    }
    
    if (chorusFeedback) {
        document.getElementById("chorusFeedbackOutput").innerHTML = chorusFeedback.value;
        chorusFeedback.oninput = function() {
            document.getElementById("chorusFeedbackOutput").innerHTML = this.value;
        }
    }
    
    if (chorusDelay) {
        document.getElementById("chorusDelayOutput").innerHTML = chorusDelay.value;
        chorusDelay.oninput = function() {
            document.getElementById("chorusDelayOutput").innerHTML = this.value;
        }
    }

    // Compressor effect sliders
    const compressorThreshold = document.getElementById("compressorThreshold");
    const compressorMakeup = document.getElementById("compressorMakeup");
    const compressorRatio = document.getElementById("compressorRatio");
    
    if (compressorThreshold) {
        document.getElementById("compressorThresholdOutput").innerHTML = compressorThreshold.value;
        compressorThreshold.oninput = function() {
            document.getElementById("compressorThresholdOutput").innerHTML = this.value;
        }
    }
    
    if (compressorMakeup) {
        document.getElementById("compressorMakeupOutput").innerHTML = compressorMakeup.value;
        compressorMakeup.oninput = function() {
            document.getElementById("compressorMakeupOutput").innerHTML = this.value;
        }
    }
    
    if (compressorRatio) {
        document.getElementById("compressorRatioOutput").innerHTML = compressorRatio.value;
        compressorRatio.oninput = function() {
            document.getElementById("compressorRatioOutput").innerHTML = this.value;
        }
    }

    // Bitcrusher effect sliders
    const bitcrusherBits = document.getElementById("bitcrusherBits");
    const bitcrusherFreq = document.getElementById("bitcrusherFreq");
    
    if (bitcrusherBits) {
        document.getElementById("bitcrusherBitsOutput").innerHTML = bitcrusherBits.value;
        bitcrusherBits.oninput = function() {
            document.getElementById("bitcrusherBitsOutput").innerHTML = this.value;
        }
    }
    
    if (bitcrusherFreq) {
        document.getElementById("bitcrusherFreqOutput").innerHTML = bitcrusherFreq.value;
        bitcrusherFreq.oninput = function() {
            document.getElementById("bitcrusherFreqOutput").innerHTML = this.value;
        }
    }

    // Phaser effect sliders
    const phaserRate = document.getElementById("phaserRate");
    const phaserDepth = document.getElementById("phaserDepth");
    const phaserFeedback = document.getElementById("phaserFeedback");
    
    if (phaserRate) {
        document.getElementById("phaserRateOutput").innerHTML = phaserRate.value;
        phaserRate.oninput = function() {
            document.getElementById("phaserRateOutput").innerHTML = this.value;
        }
    }
    
    if (phaserDepth) {
        document.getElementById("phaserDepthOutput").innerHTML = phaserDepth.value;
        phaserDepth.oninput = function() {
            document.getElementById("phaserDepthOutput").innerHTML = this.value;
        }
    }
    
    if (phaserFeedback) {
        document.getElementById("phaserFeedbackOutput").innerHTML = phaserFeedback.value;
        phaserFeedback.oninput = function() {
            document.getElementById("phaserFeedbackOutput").innerHTML = this.value;
        }
    }

    //davids part
    const LPFfreq =  document.getElementById("LPFfreq")
    const LPFQ = document.getElementById("LPFQ")

    if (LPFfreq) {
        document.getElementById("LPFFreqOutput").innerHTML = LPFfreq.value;
        LPFfreq.oninput = function() {
            document.getElementById("LPFFreqOutput").innerHTML = this.value;
        }
    }

    if (LPFQ) {
        document.getElementById("LPFQOutput").innerHTML = LPFQ.value;
        LPFQ.oninput = function() {
            document.getElementById("LPFQOutput").innerHTML = this.value;
        }
    }
    // High Pass sliders
    const HPFfreq =  document.getElementById("HPFfreq")
    const HPFQ = document.getElementById("HPFQ")

    if (HPFfreq) {
        document.getElementById("HPFFreqOutput").innerHTML = HPFfreq.value;
        HPFfreq.oninput = function() {
            document.getElementById("HPFFreqOutput").innerHTML = this.value;
        }
    }

    if (HPFQ) {
        document.getElementById("HPFQOutput").innerHTML = HPFQ.value;
        HPFQ.oninput = function() {
            document.getElementById("HPFQOutput").innerHTML = this.value;
        }
    }

    // Band Pass sliders
    const BPFfreq =  document.getElementById("BPFfreq")
    const BPFQ = document.getElementById("BPFQ")

    if (BPFfreq) {
        document.getElementById("BPFFreqOutput").innerHTML = BPFfreq.value;
        BPFfreq.oninput = function() {
            document.getElementById("BPFFreqOutput").innerHTML = this.value;
        }
    }

    if (BPFQ) {
        document.getElementById("BPFQOutput").innerHTML = HPFQ.value;
        BPFQ.oninput = function() {
            document.getElementById("BPFQOutput").innerHTML = this.value;
        }
    }

    // Notch sliders
    const Notchfreq =  document.getElementById("Notchfreq")
    const NotchQ = document.getElementById("NotchQ")

    if (Notchfreq) {
        document.getElementById("NotchFreqOutput").innerHTML = Notchfreq.value;
        Notchfreq.oninput = function() {
            document.getElementById("NotchFreqOutput").innerHTML = this.value;
        }
    }

    if (NotchQ) {
        document.getElementById("NotchQOutput").innerHTML = NotchQ.value;
        NotchQ.oninput = function() {
            document.getElementById("NotchQOutput").innerHTML = this.value;
        }
    }

    // Peaking EQ sliders
    const Peakfreq =  document.getElementById("Peakfreq")
    const PeakQ = document.getElementById("PeakQ")
    const PeakGain = document.getElementById("PeakGain")

    if (Peakfreq) {
        document.getElementById("PeakFreqOutput").innerHTML = Peakfreq.value;
        Peakfreq.oninput = function() {
            document.getElementById("PeakFreqOutput").innerHTML = this.value;
        }
    }

    if (PeakQ) {
        document.getElementById("PeakQOutput").innerHTML = PeakQ.value;
        PeakQ.oninput = function() {
            document.getElementById("PeakQOutput").innerHTML = this.value;
        }
    }

    if (PeakGain) {
        document.getElementById("PeakGainOutput").innerHTML = PeakGain.value
        PeakGain.oninput = function() {
            document.getElementById("PeakGainOutput").innerHTML = this.value
        }
    }

    // Low Shelf sliders
    const LowShelffreq =  document.getElementById("LowShelffreq")
    const LowShelfQ = document.getElementById("LowShelfQ")
    const LowShelfGain = document.getElementById("LowShelfGain")

    if (LowShelffreq) {
        document.getElementById("LowShelfFreqOutput").innerHTML = LowShelffreq.value;
        LowShelffreq.oninput = function() {
            document.getElementById("LowShelfFreqOutput").innerHTML = this.value;
        }
    }

    if (LowShelfQ) {
        document.getElementById("LowShelfQOutput").innerHTML = LowShelfQ.value;
        LowShelfQ.oninput = function() {
            document.getElementById("LowShelfQOutput").innerHTML = this.value;
        }
    }

    if (LowShelfGain) {
        document.getElementById("LowShelfGainOutput").innerHTML = LowShelfGain.value
        LowShelfGain.oninput = function() {
            document.getElementById("LowShelfGainOutput").innerHTML = this.value
        }
    }

    // High Shelf sliders
    const HighShelffreq =  document.getElementById("HighShelffreq")
    const HighShelfQ = document.getElementById("HighShelfQ")
    const HighShelfGain = document.getElementById("HighShelfGain")

    if (HighShelffreq) {
        document.getElementById("HighShelfFreqOutput").innerHTML = HighShelffreq.value;
        HighShelffreq.oninput = function() {
            document.getElementById("HighShelfFreqOutput").innerHTML = this.value;
        }
    }

    if (HighShelfQ) {
        document.getElementById("HighShelfQOutput").innerHTML = HighShelfQ.value;
        HighShelfQ.oninput = function() {
            document.getElementById("HighShelfQOutput").innerHTML = this.value;
        }
    }

    if (HighShelfGain) {
        document.getElementById("HighShelfGainOutput").innerHTML = HighShelfGain.value
        HighShelfGain.oninput = function() {
            document.getElementById("HighShelfGainOutput").innerHTML = this.value
        }
    }

    // All Pass sliders
    const AllPassfreq =  document.getElementById("AllPassfreq")
    const AllPassQ = document.getElementById("AllPassQ")
    const AllPassGain = document.getElementById("AllPassGain")

    if (HighShelffreq) {
        document.getElementById("AllPassFreqOutput").innerHTML = AllPassfreq.value;
        AllPassfreq.oninput = function() {
            document.getElementById("AllPassFreqOutput").innerHTML = this.value;
        }
    }

    if (AllPassQ) {
        document.getElementById("AllPassQOutput").innerHTML = AllPassQ.value;
        AllPassQ.oninput = function() {
            document.getElementById("AllPassQOutput").innerHTML = this.value;
        }
    }

    if (AllPassGain) {
        document.getElementById("AllPassGainOutput").innerHTML = AllPassGain.value
        AllPassGain.oninput = function() {
            document.getElementById("AllPassGainOutput").innerHTML = this.value
        }
    }

    // WahWah sliders
    const WahWahfreq = document.getElementById("WahWahfreq")
    const WahWahOctaves = document.getElementById("WahWahOctaves")
    const WahWahSweep = document.getElementById("WahWahSweep")
    const WahWahResonance = document.getElementById("WahWahResonance")
    const WahWahSensitivity = document.getElementById("WahWahSensitivity")

    if (WahWahfreq) {
        document.getElementById("WahWahFreqOutput").innerHTML = WahWahfreq.value;
        WahWahfreq.oninput = function() {
            document.getElementById("WahWahFreqOutput").innerHTML = this.value;
        }
    }

    if (WahWahOctaves) {
        document.getElementById("WahWahOctavesOutput").innerHTML = WahWahOctaves.value;
        WahWahOctaves.oninput = function() {
            document.getElementById("WahWahOctavesOutput").innerHTML = this.value;
        }
    }

    if (WahWahSweep) {
        document.getElementById("WahWahSweepOutput").innerHTML = WahWahSweep.value;
        WahWahSweep.oninput = function() {
            document.getElementById("WahWahSweepOutput").innerHTML = this.value;
        }
    }

    if (WahWahResonance) {
        document.getElementById("WahWahResonanceOutput").innerHTML = WahWahResonance.value;
        WahWahResonance.oninput = function() {
            document.getElementById("WahWahResonanceOutput").innerHTML = this.value;
        }
    }

    if (WahWahSensitivity) {
        document.getElementById("WahWahSensitivityOutput").innerHTML = WahWahSensitivity.value;
        WahWahSensitivity.oninput = function() {
            document.getElementById("WahWahSensitivityOutput").innerHTML = this.value;
        }
    }

    // Moog filter sliders
    const MoogCutoff = document.getElementById("MoogCutoff")
    const MoogResonance = document.getElementById("MoogResonance")
    const MoogBufferSize = document.getElementById("MoogBufferSize")
    if (MoogCutoff) {
        document.getElementById("MoogCutoffOutput").innerHTML = MoogCutoff.value
        MoogCutoff.oninput = function() {
            document.getElementById("MoogCutoffOutput").innerHTML = this.value
        }
    }

    if (MoogResonance) {
        document.getElementById("MoogResonanceOutput").innerHTML = MoogResonance.value
        MoogResonance.oninput = function() {
            document.getElementById("MoogResonanceOutput").innerHTML = this.value
        }
    }

    if (MoogBufferSize) {
        document.getElementById("MoogBufferSizeOutput").innerHTML = MoogBufferSize.value
        MoogBufferSize.oninput = function() {
            document.getElementById("MoogBufferSizeOutput").innerHTML = this.value
        }
    }    
    
});

function validate(parentId, childId) {
    
    const parent = document.getElementById(parentId);
    const child = document.getElementById(childId);
    
    if (parent && child) {
        if (parent.checked) {
            child.style.display = "block";
        } else {
            child.style.display = "none";
        }
    }
}

function applyEffects (){
    file = document.getElementById("inputFile").files[0]
    if (!file) {
        return console.log("Effects only cannot be applied without a valid audio file")
    }

    
    if (isPlaying && currentSource) {
        const elapsed = context.currentTime - startTime;
        pauseOffset += elapsed;
        try { currentSource.stop(); } catch (e) {}
        isPlaying = false;
        currentSource = null;
    }

    const delayEnabled = document.getElementById("effect1").checked
    const chorusEnabled = document.getElementById("effect2").checked
    const compressorEnabled = document.getElementById("effect3").checked
    const bitcrusherEnabled = document.getElementById("effect4").checked
    const phaserEnabled = document.getElementById("effect5").checked

    activeEffects = []
    activeFilters = []

    if (delayEnabled) {
        const feedback = document.getElementById("delayFeedback").value / 100; // Convert to 0-1 range
        const delayTime = parseInt(document.getElementById("delayTime").value);
        const wetLevel = document.getElementById("delayWetLevel").value / 100; // Convert to 0-1 range
        
        var delay = new tuna.Delay({
            feedback: feedback,
            delayTime: delayTime,
            wetLevel: wetLevel,
            dryLevel: 1,
            cutoff: 20000,
            bypass: false
        });
        activeEffects.push(delay);
        console.log(`Delay applied - Feedback: ${feedback}, DelayTime: ${delayTime}ms, WetLevel: ${wetLevel}`);
    }
    
    if (chorusEnabled) {
        const rate = parseFloat(document.getElementById("chorusRate").value);
        const feedback = document.getElementById("chorusFeedback").value / 100; // Convert to 0-1 range
        const delayMs = parseFloat(document.getElementById("chorusDelay").value) / 1000; // Convert to seconds
        
        var chorus = new tuna.Chorus({
            rate: rate,
            feedback: feedback,
            delay: delayMs,
            bypass: false
        });
        activeEffects.push(chorus);
        console.log(`Chorus applied - Rate: ${rate}, Feedback: ${feedback}, Delay: ${delayMs}s`);
    }
    
    if (compressorEnabled) {
        const threshold = parseInt(document.getElementById("compressorThreshold").value);
        const makeupGain = parseInt(document.getElementById("compressorMakeup").value);
        const ratio = parseInt(document.getElementById("compressorRatio").value);
        
        var compressor = new tuna.Compressor({
            threshold: threshold,
            makeupGain: makeupGain,
            attack: 1,
            release: 250,
            ratio: ratio,
            knee: 5,
            automakeup: false,
            bypass: false
        });
        activeEffects.push(compressor);
        console.log(`Compressor applied - Threshold: ${threshold}dB, Makeup: ${makeupGain}dB, Ratio: ${ratio}`);
    }
    
    if (bitcrusherEnabled) {
        const bits = parseInt(document.getElementById("bitcrusherBits").value);
        const normfreq = document.getElementById("bitcrusherFreq").value / 100; // Convert to 0-1 range
        
        var bitcrusher = new tuna.Bitcrusher({
            bits: bits,
            normfreq: normfreq,
            bufferSize: 4096
        });
        activeEffects.push(bitcrusher);
        console.log(`Bitcrusher applied - Bits: ${bits}, Frequency: ${normfreq}`);
    }
    
    if (phaserEnabled) {
        const rate = parseFloat(document.getElementById("phaserRate").value);
        const depth = document.getElementById("phaserDepth").value / 100; // Convert to 0-1 range
        const feedback = document.getElementById("phaserFeedback").value / 100; // Convert to 0-1 range
        
        var phaser = new tuna.Phaser({
            rate: rate,
            depth: depth,
            feedback: feedback,
            stereoPhase: 40,
            baseModulationFrequency: 700,
            bypass: false
        });
        activeEffects.push(phaser);
        console.log(`Phaser applied - Rate: ${rate}, Depth: ${depth}, Feedback: ${feedback}`);
    }


    if (!decodedBuffer) {
        file.arrayBuffer()
            .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                decodedBuffer = audioBuffer;
                console.log(`Processed audio with ${activeEffects.length} effect(s) and ${activeFilters.length} filter(s`);
            })
            .catch(err => console.error("Error processing audio:", err));
    } else {
        // already decoded -> just rebuild chain with new effects/filters
        console.log(`Re-applied processing with ${activeEffects.length} effect(s) and ${activeFilters.length} filter(s)`);
    }
}

function applyFilters (){
    file = document.getElementById("inputFile").files[0]
    if (!file) {
        return console.log("Filters only cannot be applied without a valid audio file")
    }

    if (isPlaying && currentSource) {
        const elapsed = context.currentTime - startTime;
        pauseOffset += elapsed;
        try { currentSource.stop(); } catch (e) {}
        isPlaying = false;
        currentSource = null;
    }


    // David Part start
    const LPF_enabled = document.getElementById("filterLPF").checked
    const HPF_enabled = document.getElementById("filterHPF").checked
    const BPF_enabled = document.getElementById("filterBPF").checked
    const Notch_enabled = document.getElementById("filterNotch").checked
    const Peak_enabled = document.getElementById("filterPeak").checked
    const LowShelf_enabled = document.getElementById("filterLowShelf").checked
    const HighShelf_enabled = document.getElementById("filterHighShelf").checked
    const AllPass_enabled = document.getElementById("filterAllPass").checked
    const WahWah_enabled = document.getElementById("filterWahWah").checked
    const Moog_enabled = document.getElementById("filterMoog").checked

    activeEffects = []
    activeFilters = []

    // Low pass
    if (LPF_enabled) {
        let f = context.createBiquadFilter()
        f.type = "lowpass"
        f.frequency.value = document.getElementById("LPFfreq").value
        f.Q.value = document.getElementById("LPFQ").value
        activeFilters.push(f)
    }
    // High-pass
    if (HPF_enabled) {
        let f = context.createBiquadFilter()
        f.type = "highpass"
        f.frequency.value = document.getElementById("HPFfreq").value
        f.Q.value = document.getElementById("HPFQ").value
        activeFilters.push(f)
    }
    // Band pass
    if (BPF_enabled) {
        let f = context.createBiquadFilter()
        f.type = "bandpass"
        f.frequency.value = document.getElementById("BPFfreq").value
        f.Q.value = document.getElementById("BPFQ").value
        activeFilters.push(f)
    }
    // Notch filter
    if (Notch_enabled) {
        let f = context.createBiquadFilter()
        f.type = "notch"
        f.frequency.value = document.getElementById("Notchfreq").value
        f.Q.value = document.getElementById("NotchQ").value
        activeFilters.push(f)
    } 
    // Peaking EQ band filter
    if (Peak_enabled) {
        let f = context.createBiquadFilter()
        f.type = "peaking"
        f.frequency.value = document.getElementById("Peakfreq").value
        f.Q.value = document.getElementById("PeakQ").value
        f.gain.value = document.getElementById("PeakGain").value
        activeFilters.push(f)
    }
    // Low Shelf filter
    if (LowShelf_enabled) {
        let f = context.createBiquadFilter()
        f.type = "lowshelf"
        f.frequency.value = document.getElementById("LowShelffreq").value
        f.Q.value = document.getElementById("LowShelfQ").value
        f.gain.value = document.getElementById("LowShelfGain").value
        activeFilters.push(f)
    }
    // High Shelf filter
    if (HighShelf_enabled) {
        let f = context.createBiquadFilter()
        f.type = "highshelf"
        f.frequency.value = document.getElementById("HighShelffreq").value
        f.Q.value = document.getElementById("HighShelfQ").value
        f.gain.value = document.getElementById("HighShelfGain").value
        activeFilters.push(f)
    }
    // All Pass filter
    if (AllPass_enabled) {
        let f = context.createBiquadFilter()
        f.type = "allpass"
        f.frequency.value = document.getElementById("AllPassfreq").value
        f.Q.value = document.getElementById("AllPassQ").value
        f.gain.value = document.getElementById("AllPassGain").value
        activeFilters.push(f)
    }
    // WahWah filter
    if (WahWah_enabled) {
        let wah = new tuna.WahWah({
            automode: true,
            baseFrequency: parseFloat(document.getElementById("WahWahfreq").value),
            excursionOctaves: parseFloat(document.getElementById("WahWahOctaves").value),
            sweep: parseFloat(document.getElementById("WahWahSweep").value),
            resonance: parseFloat(document.getElementById("WahWahResonance").value),
            sensitivity: parseFloat(document.getElementById("WahWahSensitivity").value),
            bypass: false
        })
        activeFilters.push(wah)
        console.log(`WahWah applied - BaseFreq: ${wah.baseFrequency}, Octaves: ${wah.excursionOctaves}, Sweep: ${wah.sweep}, Resonance: ${wah.resonance}, Sensitivity: ${wah.sensitivity}`)
    }
    // Moog filter
    if (Moog_enabled) {
        let moog = new tuna.MoogFilter({
            cutoff: parseFloat(document.getElementById("MoogCutoff").value),
            resonance: parseFloat(document.getElementById("MoogResonance").value),
            bufferSize: parseInt(document.getElementById("MoogBufferSize").value),
            bypass: false
        });
        activeFilters.push(moog)
        console.log(`Moog Filter applied - Cutoff: ${moog.cutoff}, Resonance: ${moog.resonance}, BufferSize: ${moog.bufferSize}`);
    }    
    
    if (activeEffects.length === 0) {
        console.log("No effects selected. Please select at least one effect.");
    }

    if (activeFilters.length === 0) {
        console.log("No filters selected. Please select at least one filters.");
    }
    
    if (!decodedBuffer) {
        file.arrayBuffer()
            .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                decodedBuffer = audioBuffer;
                console.log(`Processed audio with ${activeEffects.length} effect(s) and ${activeFilters.length} filter(s`);
            })
            .catch(err => console.error("Error processing audio:", err));
    } else {
        // already decoded -> just rebuild chain with new effects/filters
        console.log(`Re-applied processing with ${activeEffects.length} effect(s) and ${activeFilters.length} filter(s`);
    }
}

function downloadCurrentEdits() {
    const formatSel = document.getElementById('downloadFormat');
    const format = formatSel ? formatSel.value : 'wav';

    // Must have a file and decoded buffer
    const input = document.getElementById('inputFile');
    const selectedFile = input && input.files && input.files[0] ? input.files[0] : null;
    if (!selectedFile) {
        console.log('Please choose an audio file first.');
        return;
    }
    if (!decodedBuffer) {
        console.log('Please click Apply/Play to process the audio first.');
        return;
    }

    // Render the current chain (effects + filters) offline to capture processed audio
    const length = decodedBuffer.length;
    const sampleRate = decodedBuffer.sampleRate;
    const numberOfChannels = decodedBuffer.numberOfChannels;

    const offline = new OfflineAudioContext(numberOfChannels, length, sampleRate);

    // Recreate Tuna for the offline context so effects can be applied during rendering
    const offlineTuna = new Tuna(offline);

    // Rebuild effect/filter chain for the offline context using current UI values
    const buildChainForOffline = () => {
        let nodes = [];

        // Effects: read UI, instantiate for offline context similar to apply()
        if (document.getElementById('effect1')?.checked) {
            const feedback = document.getElementById('delayFeedback').value / 100;
            const delayTime = parseInt(document.getElementById('delayTime').value);
            const wetLevel = document.getElementById('delayWetLevel').value / 100;
            nodes.push(new offlineTuna.Delay({ feedback, delayTime, wetLevel, dryLevel: 1, cutoff: 20000, bypass: false }));
        }
        if (document.getElementById('effect2')?.checked) {
            const rate = parseFloat(document.getElementById('chorusRate').value);
            const feedback = document.getElementById('chorusFeedback').value / 100;
            const delay = parseFloat(document.getElementById('chorusDelay').value) / 1000;
            nodes.push(new offlineTuna.Chorus({ rate, feedback, delay, bypass: false }));
        }
        if (document.getElementById('effect3')?.checked) {
            const threshold = parseInt(document.getElementById('compressorThreshold').value);
            const makeupGain = parseInt(document.getElementById('compressorMakeup').value);
            const ratio = parseInt(document.getElementById('compressorRatio').value);
            nodes.push(new offlineTuna.Compressor({ threshold, makeupGain, attack: 1, release: 250, ratio, knee: 5, automakeup: false, bypass: false }));
        }
        if (document.getElementById('effect4')?.checked) {
            const bits = parseInt(document.getElementById('bitcrusherBits').value);
            const normfreq = document.getElementById('bitcrusherFreq').value / 100;
            nodes.push(new offlineTuna.Bitcrusher({ bits, normfreq, bufferSize: 4096 }));
        }
        if (document.getElementById('effect5')?.checked) {
            const rate = parseFloat(document.getElementById('phaserRate').value);
            const depth = document.getElementById('phaserDepth').value / 100;
            const feedback = document.getElementById('phaserFeedback').value / 100;
            nodes.push(new offlineTuna.Phaser({ rate, depth, feedback, stereoPhase: 40, baseModulationFrequency: 700, bypass: false }));
        }

        // Filters
        const pushFilter = (type, freqId, qId, gainId) => {
            const f = offline.createBiquadFilter();
            f.type = type;
            if (freqId) f.frequency.value = parseFloat(document.getElementById(freqId).value);
            if (qId) f.Q.value = parseFloat(document.getElementById(qId).value);
            if (gainId) f.gain.value = parseFloat(document.getElementById(gainId).value);
            nodes.push(f);
        };

        if (document.getElementById('filterLPF')?.checked) pushFilter('lowpass', 'LPFfreq', 'LPFQ');
        if (document.getElementById('filterHPF')?.checked) pushFilter('highpass', 'HPFfreq', 'HPFQ');
        if (document.getElementById('filterBPF')?.checked) pushFilter('bandpass', 'BPFfreq', 'BPFQ');
        if (document.getElementById('filterNotch')?.checked) pushFilter('notch', 'Notchfreq', 'NotchQ');
        if (document.getElementById('filterPeak')?.checked) pushFilter('peaking', 'Peakfreq', 'PeakQ', 'PeakGain');
        if (document.getElementById('filterLowShelf')?.checked) pushFilter('lowshelf', 'LowShelffreq', 'LowShelfQ', 'LowShelfGain');
        if (document.getElementById('filterHighShelf')?.checked) pushFilter('highshelf', 'HighShelffreq', 'HighShelfQ', 'HighShelfGain');
        if (document.getElementById('filterAllPass')?.checked) pushFilter('allpass', 'AllPassfreq', 'AllPassQ', 'AllPassGain');

        if (document.getElementById('filterWahWah')?.checked) {
            const baseFrequency = parseFloat(document.getElementById("WahWahfreq").value)
            const octaves = parseFloat(document.getElementById("WahWahOctaves").value)
            const sweep = parseFloat(document.getElementById("WahWahSweep").value)
            const resonance = parseFloat(document.getElementById("WahWahResonance").value)
            const sensitivity = parseFloat(document.getElementById("WahWahSensitivity").value)

            nodes.push(new offlineTuna.WahWah({
                automode: true,
                baseFrequency: baseFrequency,
                excursionOctaves: octaves,
                sweep: sweep,
                resonance: resonance,
                sensitivity: sensitivity,
                bypass: false
            }))
        }

        if (document.getElementById('filterMoog')?.checked) {
            const cutoff = parseFloat(document.getElementById("MoogCutoff").value)
            const resonance = parseFloat(document.getElementById("MoogResonance").value)
            const bufferSize = parseInt(document.getElementById("MoogBufferSize").value)

            nodes.push(new offlineTuna.MoogFilter({
                cutoff: cutoff,
                resonance: resonance,
                bufferSize: bufferSize,
                bypass: false
            }))
        }

        return nodes;
    };

    const source = offline.createBufferSource();
    source.buffer = decodedBuffer;

    const nodes = buildChainForOffline();
    let current = source;
    nodes.forEach(n => { current.connect(n); current = n; });
    current.connect(offline.destination);

    source.start(0);

    offline.startRendering()
        .then(renderedBuffer => {
            if (format === 'mp3') {
                if (typeof lamejs === 'undefined') {
                    console.error('MP3 encoder (lamejs) not loaded; falling back to WAV.');
                    const wavBlob = encodeWAV(renderedBuffer);
                    triggerDownload(wavBlob, changeExt(selectedFile.name, 'wav'));
                } else {
                    const mp3Blob = encodeMP3(renderedBuffer);
                    triggerDownload(mp3Blob, changeExt(selectedFile.name, 'mp3'));
                }
            } else {
                const wavBlob = encodeWAV(renderedBuffer);
                triggerDownload(wavBlob, changeExt(selectedFile.name, 'wav'));
            }
        })
        .catch(err => {
            console.error('Error rendering offline audio:', err);
        });
} 

// Utility: change file extension
function changeExt(filename, newExt) {
    const idx = filename.lastIndexOf('.');
    const base = idx > -1 ? filename.slice(0, idx) : filename;
    return `${base}.${newExt}`;
}

// Utility: download Blob
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Encode an AudioBuffer to WAV (16-bit PCM)
function encodeWAV(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.length;

    // Interleave channels
    const channelData = [];
    for (let ch = 0; ch < numChannels; ch++) {
        channelData.push(audioBuffer.getChannelData(ch));
    }

    let interleaved;
    if (numChannels === 2) {
        interleaved = interleave(channelData[0], channelData[1]);
    } else if (numChannels === 1) {
        interleaved = channelData[0];
    } else {
        // Mixdown to stereo if >2 channels
        const left = channelData[0];
        const right = channelData[1] || channelData[0];
        interleaved = interleave(left, right);
    }

    const wavBuffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(wavBuffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt  chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM
    view.setUint16(20, 1, true);  // linear PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
    view.setUint16(32, numChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    // PCM samples
    floatTo16BitPCM(view, 44, interleaved);

    return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        output.setInt16(offset, s, true);
    }
}

function interleave(left, right) {
    const length = left.length + right.length;
    const result = new Float32Array(length);
    let index = 0;
    for (let i = 0; i < left.length; i++) {
        result[index++] = left[i];
        result[index++] = right[i];
    }
    return result;
}

// Encode to MP3 using lamejs
function encodeMP3(audioBuffer) {
    const numChannels = Math.min(2, audioBuffer.numberOfChannels);
    const sampleRate = audioBuffer.sampleRate;
    const kbps = 192; // bitrate

    const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);

    // Prepare PCM int16
    const left = audioBuffer.getChannelData(0);
    const right = numChannels > 1 ? audioBuffer.getChannelData(1) : left;

    const blockSize = 1152; // MP3 frame samples per channel
    let mp3Data = [];

    for (let i = 0; i < left.length; i += blockSize) {
        const leftChunk = floatToInt16(left.subarray(i, i + blockSize));
        let mp3buf;
        if (numChannels === 2) {
            const rightChunk = floatToInt16(right.subarray(i, i + blockSize));
            mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        } else {
            mp3buf = mp3encoder.encodeBuffer(leftChunk);
        }
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }
    const end = mp3encoder.flush();
    if (end.length > 0) mp3Data.push(end);

    return new Blob(mp3Data, { type: 'audio/mpeg' });
}

function floatToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}