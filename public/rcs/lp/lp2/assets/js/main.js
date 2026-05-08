/*!
 * Royal Chester Saga - Hanabi × Wedding LP Scripts
 * Copyright (c) Royal Chester Saga. All rights reserved.
 * Produced by LINK-UP Management
 */

(function(){
  'use strict';
  
  // === カウントダウン（5月10日 23:59 まで） ===
  (function(){
    const target = new Date('2026-05-10T23:59:00+09:00').getTime();
    const el = document.getElementById('countdown');
    if(!el) return;
    
    function tick(){
      const now = Date.now();
      const diff = target - now;
      if(diff <= 0){
        el.innerHTML = '<b>0</b>日<b>00</b>時<b>00</b>分';
        return;
      }
      const days = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
      const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
      el.innerHTML = `<b>${days}</b>日<b>${String(hours).padStart(2,'0')}</b>時<b>${String(mins).padStart(2,'0')}</b>分`;
    }
    tick();
    setInterval(tick, 60000);
  })();
  
  // === Reveal アニメーション (3段階セーフティネット) ===
  (function(){
    document.body.classList.add('js-reveal-ready');
    
    const reveals = document.querySelectorAll('.reveal');
    if(!reveals.length) return;
    
    // IntersectionObserver で順次表示
    if('IntersectionObserver' in window){
      const observer = new IntersectionObserver((entries)=>{
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      }, {rootMargin: '0px 0px -10% 0px', threshold: 0.1});
      
      reveals.forEach(el => observer.observe(el));
    } else {
      // フォールバック: 即時表示
      reveals.forEach(el => el.classList.add('in'));
    }
    
    // セーフティ1: 1秒後にビューポート内のものを強制表示
    setTimeout(()=>{
      reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        if(rect.top < window.innerHeight && rect.bottom > 0){
          el.classList.add('in');
        }
      });
    }, 1000);
    
    // セーフティ2: 3秒後に全要素強制表示
    setTimeout(()=>{
      reveals.forEach(el => el.classList.add('in'));
    }, 3000);
  })();
  
  // === スムーススクロール ===
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e){
      const target = document.querySelector(this.getAttribute('href'));
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth',block:'start'});
      }
    });
  });
  
})();
