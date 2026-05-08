// カウントダウン（応募締切：2026年5月10日 23:59）
function tickCountdown(){
  var deadline = new Date('2026-05-10T23:59:59+09:00').getTime();
  var now = Date.now();
  var diff = deadline - now;
  if(diff <= 0){
    document.querySelectorAll('#countdown,#countdown-final').forEach(function(el){el.textContent='応募受付終了'});
    return;
  }
  var days = Math.floor(diff / (1000*60*60*24));
  var hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  var mins = Math.floor((diff % (1000*60*60)) / (1000*60));
  var top = document.getElementById('countdown');
  if(top) top.innerHTML = '<b>'+days+'</b>日<b>'+hours+'</b>時間<b>'+mins+'</b>分';
  var fin = document.getElementById('countdown-final');
  if(fin) fin.textContent = days+'日 '+hours+'時間 '+mins+'分';
}
tickCountdown();
setInterval(tickCountdown, 30000);

// FAQ アコーディオン
function toggleFaq(btn){
  var item = btn.closest('.faq-item');
  var isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(el){el.classList.remove('open')});
  if(!isOpen) item.classList.add('open');
}

// fade-up 出現
var observer = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.fade-up').forEach(function(el){observer.observe(el)});

// fallback: 何かの理由でobserverが発火しなかった場合、3秒後に全部表示
setTimeout(function(){
  document.querySelectorAll('.fade-up:not(.visible)').forEach(function(el){el.classList.add('visible')});
}, 3000);