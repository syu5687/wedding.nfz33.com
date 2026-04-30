/*!
 * Le Diaphane (Royal Chester Saga) - Landing Page Scripts
 * Copyright (c) Memolead. All rights reserved.
 * Produced by LINK-UP Management
 */

(function(){
  'use strict';
  
  // カウントダウン (キャンペーン終了まで)
  (function(){
    const deadline = new Date('2026-05-31T23:59:59').getTime();
    const el = document.getElementById('countdown');
    function tick(){
      const now = new Date().getTime();
      const d = deadline - now;
      if(d<0){el.innerHTML='<b>受付終了</b>';return}
      const days = Math.floor(d/(1000*60*60*24));
      const hrs = Math.floor((d%(1000*60*60*24))/(1000*60*60));
      const mins = Math.floor((d%(1000*60*60))/(1000*60));
      el.innerHTML = `<b>${days}</b>日<b>${String(hrs).padStart(2,'0')}</b>時<b>${String(mins).padStart(2,'0')}</b>分`;
    }
    tick();setInterval(tick,60000);
  })();

  // FAQ アコーディオン
  document.querySelectorAll('.faq-q').forEach(q=>{
    q.addEventListener('click',()=>{
      q.parentElement.classList.toggle('open');
    });
  });

  // スクロール出現 - JS有効を明示してから初期化
  document.body.classList.add('js-reveal-ready');

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  },{threshold:0.01, rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // 即時発火: 初期表示時に画面内or画面下方近接の要素は即in化
  requestAnimationFrame(()=>{
    document.querySelectorAll('.reveal').forEach(el=>{
      const rect = el.getBoundingClientRect();
      if(rect.top < window.innerHeight + 200){
        el.classList.add('in');
      }
    });
  });

  // セーフティネット1: 1秒後、まだ未発火の要素のうち画面内なら強制表示
  setTimeout(()=>{
    document.querySelectorAll('.reveal:not(.in)').forEach(el=>{
      const rect = el.getBoundingClientRect();
      if(rect.top < window.innerHeight + 500){
        el.classList.add('in');
      }
    });
  }, 1000);

  // セーフティネット2: 3秒後、まだ未発火なら全て強制表示
  setTimeout(()=>{
    document.querySelectorAll('.reveal:not(.in)').forEach(el=>el.classList.add('in'));
  }, 3000);

  // IntersectionObserverをサポートしない古いブラウザ向けフォールバック
  if(!('IntersectionObserver' in window)){
    document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
  }

  // リアルタイム予約数 (徐々に増加するソーシャルプルーフ)
  (function(){
    const el = document.getElementById('rtCount');
    if(!el) return;
    let count = parseInt(el.textContent);
    setInterval(()=>{
      if(Math.random() > 0.7){
        count += 1;
        el.textContent = count;
        el.style.transition = 'all .3s';
        el.style.transform = 'scale(1.2)';
        setTimeout(()=>el.style.transform='scale(1)',300);
      }
    }, 45000); // 45秒に1回程度
  })();

  // 離脱意図検知モーダル (PC: マウスがウィンドウ上部から外に出た時)
  (function(){
    const modal = document.getElementById('exitModal');
    const closeBtn = document.getElementById('exitClose');
    let shown = sessionStorage.getItem('exitShown');
    
    function showModal(){
      if(shown) return;
      modal.classList.add('show');
      sessionStorage.setItem('exitShown','1');
      shown = true;
    }
    
    closeBtn.addEventListener('click',()=>modal.classList.remove('show'));
    modal.addEventListener('click',(e)=>{
      if(e.target === modal) modal.classList.remove('show');
    });
    
    // PC: マウスが画面上部から離脱
    document.addEventListener('mouseleave',(e)=>{
      if(e.clientY <= 0 && window.innerWidth >= 768) showModal();
    });
    
    // モバイル: 一定時間スクロールなし or 戻るボタン
    let lastScroll = 0;
    let idleTimer;
    
    function resetIdle(){
      clearTimeout(idleTimer);
      idleTimer = setTimeout(()=>{
        if(window.innerWidth < 768 && window.scrollY > 500) showModal();
      }, 60000); // 60秒間操作なしで表示
    }
    
    window.addEventListener('scroll',resetIdle,{passive:true});
    window.addEventListener('touchstart',resetIdle,{passive:true});
    resetIdle();
  })();
})();
