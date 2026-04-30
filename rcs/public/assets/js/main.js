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

  // ==========================================
  // 離脱意図検知モーダル - 最強CV版
  // 5系統の離脱シグナルを検知し、1セッション1回限り表示
  // ==========================================
  (function(){
    const modal = document.getElementById('exitModal');
    const closeBtn = document.getElementById('exitClose');
    if(!modal || !closeBtn) return;
    
    let shown = sessionStorage.getItem('exitShown') === '1';
    const startTime = Date.now();
    const MIN_DWELL = 8000; // 最低8秒は閲覧してから発火（即離脱の人には出さない）
    
    function showModal(reason){
      if(shown) return;
      // 最低滞在時間チェック
      if(Date.now() - startTime < MIN_DWELL) return;
      
      modal.classList.add('show');
      sessionStorage.setItem('exitShown','1');
      shown = true;
      
      // GTM/GA4イベント送信（接続済みの場合のみ）
      try {
        if(window.dataLayer){
          window.dataLayer.push({
            event: 'exit_intent_shown',
            exit_reason: reason
          });
        }
      } catch(e){}
    }
    
    // === モーダル閉じる動作 ===
    closeBtn.addEventListener('click', ()=> modal.classList.remove('show'));
    modal.addEventListener('click', (e)=>{
      if(e.target === modal) modal.classList.remove('show');
    });
    // ESCキーで閉じる
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && modal.classList.contains('show')){
        modal.classList.remove('show');
      }
    });
    
    // ==========================================
    // 【トリガー1】PC: マウスが画面上部から離脱
    // ==========================================
    document.addEventListener('mouseleave', (e)=>{
      if(e.clientY <= 0 && window.innerWidth >= 768){
        showModal('mouse_top_exit');
      }
    });
    
    // ==========================================
    // 【トリガー2】SP: 履歴戻る検知 (history API)
    // ユーザーが「戻る」ボタンを押した瞬間を捕捉
    // ==========================================
    (function(){
      // pushStateで仮想エントリを追加
      if(window.history && window.history.pushState){
        history.pushState({page: 'lp'}, '', location.href);
        window.addEventListener('popstate', function(){
          if(window.innerWidth < 768){
            showModal('history_back');
            // モーダル表示後、再度仮想エントリを追加して2回目の戻るで離脱可能に
            history.pushState({page: 'lp'}, '', location.href);
          }
        });
      }
    })();
    
    // ==========================================
    // 【トリガー3】SP: 一定時間無操作 + スクロール深度
    // 30秒無操作 かつ スクロール80%超 = 読了済み迷い中
    // 60秒無操作 = 単純な放置 (フォールバック)
    // ==========================================
    let idleTimer30 = null;
    let idleTimer60 = null;
    
    function getScrollPct(){
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if(docH <= 0) return 0;
      return (window.scrollY / docH) * 100;
    }
    
    function resetIdle(){
      if(window.innerWidth >= 768) return; // SP専用
      
      clearTimeout(idleTimer30);
      clearTimeout(idleTimer60);
      
      // 30秒で深いスクロール済みなら表示（読了→迷い）
      idleTimer30 = setTimeout(()=>{
        if(getScrollPct() >= 80){
          showModal('idle_30s_deep_scroll');
        }
      }, 30000);
      
      // 60秒無操作で強制表示（離脱前最終防衛線）
      idleTimer60 = setTimeout(()=>{
        if(window.scrollY > 500){
          showModal('idle_60s');
        }
      }, 60000);
    }
    
    window.addEventListener('scroll', resetIdle, {passive: true});
    window.addEventListener('touchstart', resetIdle, {passive: true});
    window.addEventListener('click', resetIdle);
    resetIdle();
    
    // ==========================================
    // 【トリガー4】SP: ページ最下部到達検知
    // フッター見たユーザー = 読了済 → 即発火
    // ==========================================
    (function(){
      let bottomReached = false;
      window.addEventListener('scroll', ()=>{
        if(bottomReached || window.innerWidth >= 768) return;
        const scrollBottom = window.scrollY + window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        // 最下部から200px以内に到達
        if(scrollBottom >= docHeight - 200){
          bottomReached = true;
          // 読了直後の3秒待ち（CTAクリックチャンスを与える）
          setTimeout(()=>{
            if(!shown){
              showModal('reached_bottom');
            }
          }, 3000);
        }
      }, {passive: true});
    })();
    
    // ==========================================
    // 【トリガー5】タブ離脱からの復帰検知
    // 別タブに行って戻ってきた = 比較検討中 → 引き止め
    // ==========================================
    (function(){
      let leftPage = false;
      let leftTime = 0;
      
      document.addEventListener('visibilitychange', ()=>{
        if(document.hidden){
          leftPage = true;
          leftTime = Date.now();
        } else if(leftPage){
          const awayDuration = Date.now() - leftTime;
          // 5秒以上離れて戻ってきた場合のみ発火（チラ見ではなく明確な離脱）
          if(awayDuration > 5000 && window.innerWidth < 768){
            // 復帰直後の2秒待ち
            setTimeout(()=>{
              if(!shown){
                showModal('returned_from_tab');
              }
            }, 2000);
          }
          leftPage = false;
        }
      });
    })();
    
  })();
})();
