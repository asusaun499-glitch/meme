(() => {
  const video = document.querySelector('#camera');
  const canvas = document.querySelector('#overlay');
  const ctx = canvas.getContext('2d');
  const $ = (s) => document.querySelector(s);
  const state = { camera: null, hands: null, lastMemeAt: 0, hideTimer: 0, lastGesture: '', frames: 0, fpsAt: performance.now() };
  const FINGER_NAMES = ['thumb', 'index', 'middle', 'ring', 'pinky'];
  const folderByGesture = { middle: 'middle', middle_finger: 'middle', thumb: 'thumb', index: 'index', ring: 'ring', pinky: 'pinky', peace: 'peace', open: 'open', fist: 'fist', point: 'point', pinch: 'pinch', ok: 'ok' };
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  function fingerState(lm) {
    // Compare each fingertip to its intermediate joint, oriented using wrist-to-knuckle distance.
    const palm = dist(lm[0], lm[9]);
    const extended = [
      dist(lm[4], lm[0]) > dist(lm[3], lm[0]) * 1.12,
      lm[8].y < lm[6].y - palm * .06,
      lm[12].y < lm[10].y - palm * .06,
      lm[16].y < lm[14].y - palm * .06,
      lm[20].y < lm[18].y - palm * .06
    ];
    // Thumb extension direction differs with hand orientation; use distance from palm center.
    extended[0] = dist(lm[4], lm[0]) > dist(lm[3], lm[0]) * 1.12;
    return extended;
  }
  function classify(lm, fingers) {
    const [thumb,index,middle,ring,pinky] = fingers;
    const pinch = dist(lm[4],lm[8]) < dist(lm[0],lm[9]) * .30;
    if (pinch) return 'pinch';
    // Gesture aliases are checked first, then exact finger combinations so every pose has a stable folder key.
    if (index && middle && !ring && !pinky && !thumb) return 'peace';
    if (!thumb && !index && middle && !ring && !pinky) return 'middle_finger';
    if (thumb && !index && !middle && !ring && !pinky) return 'thumb';
    if (!thumb && index && !middle && !ring && !pinky) return 'point';
    if (thumb && index && middle && ring && pinky) return 'open';
    if (!thumb && !index && !middle && !ring && !pinky) return 'fist';
    if (thumb && index && !middle && !ring && !pinky) return 'ok';
    return fingers.map((up,i) => up ? FINGER_NAMES[i] : '').filter(Boolean).join('_') || 'fist';
  }
  function draw(results) {
    const w = canvas.width = video.videoWidth || 640, h = canvas.height = video.videoHeight || 480;
    ctx.clearRect(0,0,w,h);
    const hands = results.multiHandLandmarks || [];
    $('#handCount').textContent = `${hands.length} ${hands.length === 1 ? 'hand' : 'hands'} detected`;
    hands.forEach((lm, n) => {
      const fingers = fingerState(lm), gesture = classify(lm, fingers);
      drawHand(lm,w,h);
      if (n === 0 && $('#gestureToggle').checked) setGesture(gesture, fingers);
    });
    if (!hands.length) { state.lastGesture=''; document.querySelectorAll('.gesture-tile').forEach(x=>x.classList.remove('active')); }
    state.frames++;
    const now=performance.now();
    if(now-state.fpsAt>1000){$('#fps').textContent=Math.round(state.frames*1000/(now-state.fpsAt));state.frames=0;state.fpsAt=now;}
  }
  function drawHand(lm,w,h) {
    const links=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
    ctx.lineWidth=3;ctx.lineCap='round';ctx.strokeStyle='#9e83ff';
    links.forEach(path=>{ctx.beginPath();path.forEach((i,k)=>{const p=lm[i];k?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h)});ctx.stroke()});
    lm.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x*w,p.y*h,i%4===0?4:2.4,0,Math.PI*2);ctx.fillStyle=i===8||i===12?'#57e5ae':'#e7e2ff';ctx.fill()});
  }
  function setGesture(name, fingers) {
    if(name===state.lastGesture)return;
    state.lastGesture=name;
    document.querySelectorAll('.gesture-tile').forEach(tile=>tile.classList.toggle('active', tile.textContent.toLowerCase().includes(name.replace('_finger','')) || (name==='middle_finger'&&tile.textContent.includes('Middle'))));
    if ($('#memeToggle').checked && name) showMeme(name);
  }
  async function showMeme(gesture) {
    const now=performance.now(); if(now-state.lastMemeAt<500)return; state.lastMemeAt=now;
    const folder=folderByGesture[gesture] || gesture;
    const overlay=$('#memeOverlay'), img=$('#memeImage');
    let imageUrl='';
    try {
      const response=await fetch('memes/manifest.json',{cache:'no-store'});
      if(response.ok){
        const data=await response.json(), items=data.categories?.[folder]||[];
        if(items.length){const selected=items[Math.floor(Math.random()*items.length)];imageUrl=selected.startsWith('http')?selected:`memes/${selected}`;}
      }
    } catch(e) { /* Try the live meme API if the local library cannot be read. */ }
    if(!imageUrl){try{const remote=await window.fetchGestureMeme(gesture);if(remote?.url)imageUrl=remote.url;}catch(e){return;}}
    img.classList.remove('visible');img.removeAttribute('src');
    try {
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=imageUrl;});
      if(!img.naturalWidth)return;
      await img.decode?.();
      overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');img.classList.add('visible');
      clearTimeout(state.hideTimer);
      state.hideTimer=setTimeout(()=>{overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');img.classList.remove('visible');img.removeAttribute('src');},1500);
    } catch(e) { /* Skip failed image URLs without showing text placeholders. */ }
  }
  async function startCamera() {
    try {
      if(!window.Hands||!window.Camera)throw new Error('MediaPipe did not load. Check your internet connection.');
      $('#startButton').disabled=true;$('#stageStart').disabled=true;$('#cameraStatus').textContent='Connecting to camera…';
      state.hands=new Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
      state.hands.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:.65,minTrackingConfidence:.6});
      state.hands.onResults(draw);
      state.camera=new Camera(video,{onFrame:async()=>{await state.hands.send({image:video});},width:1280,height:720});
      await state.camera.start();video.classList.add('show');canvas.classList.add('show');$('#placeholder').style.display='none';$('#trackingChip').classList.add('show');$('#cameraStatus').textContent='Camera live · local processing';$('#startButton').innerHTML='<span>●</span> Camera active';
    } catch(err) { $('#cameraStatus').textContent='Camera is off';$('#toast').textContent=err.message||'Could not start the camera';$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),4000);$('#startButton').disabled=false;$('#stageStart').disabled=false; }
  }
  $('#startButton').addEventListener('click',startCamera);$('#stageStart').addEventListener('click',startCamera);
  $('#fullscreenButton').addEventListener('click',()=>{const stage=$('#stage');if(!document.fullscreenElement)stage.requestFullscreen?.();else document.exitFullscreen?.();});
  $('#gestureToggle').addEventListener('change',e=>{if(!e.target.checked)document.querySelectorAll('.gesture-tile').forEach(x=>x.classList.remove('active'));});
})();
