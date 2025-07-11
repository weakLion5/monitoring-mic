const startBtn = document.getElementById('start');
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

let source, audioContext;

const badWords = ["anjing", "kontol", "bangsat", "memek", "fuck", "shit", "nigga", "nigger", "bitch", "bastard"];

startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext();
    source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      canvasCtx.fillStyle = '#1e293b';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#22d3ee';
      canvasCtx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    }

    draw();

    // Speech recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser kamu tidak mendukung Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'id-ID';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log("Terucap:", transcript);
      if (badWords.some(word => transcript.includes(word))) {
        console.warn("Kata kasar terdeteksi, mute mic sementara!");
        source.disconnect(audioContext.destination);
        setTimeout(() => {
          source.connect(audioContext.destination);
        }, 3000);
      }
    };

    recognition.onerror = (err) => {
      console.error("Speech Recognition Error:", err);
    };

    recognition.start();
    alert("Mic & sensor aktif. Ucapkan sesuatu...");
  } catch (err) {
    alert("Gagal akses mic: " + err.message);
    console.error(err);
  }
});
