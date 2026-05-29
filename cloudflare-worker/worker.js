/**
 * Royal Chester Saga - Form Submission Worker
 * Receives POST from /rcs/lp/lp1/ form, forwards to Resend API for email delivery.
 *
 * Required Environment Variables (set via Cloudflare Dashboard or `wrangler secret`):
 *   - RESEND_API_KEY: Resend API key (re_xxxxxxxxxxx)
 *   - TO_EMAIL:       Receiving email address (e.g. info@rc-saga.jp)
 *   - FROM_EMAIL:     Verified sender domain on Resend (e.g. noreply@rc-saga.jp)
 *   - ALLOWED_ORIGIN: Comma-separated allowed origins for CORS
 *                     (e.g. https://rc-saga.jp,https://wedding-nfz33-com-665477084949.asia-northeast1.run.app)
 */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export default {
  async fetch(request, env) {
    // === CORS preflight ===
    if (request.method === 'OPTIONS') {
      return handleCors(request, env);
    }

    // === Method check ===
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, request, env);
    }

    try {
      // === Parse JSON ===
      let data;
      try {
        data = await request.json();
      } catch {
        return jsonResponse({ error: 'Invalid JSON' }, 400, request, env);
      }

      // === Honeypot check ===
      if (data.website && data.website.trim() !== '') {
        // Bot detected — pretend success to avoid retries
        return jsonResponse({ ok: true }, 200, request, env);
      }

      // === Required fields ===
      if (!data.name || !data.tel) {
        return jsonResponse({ error: 'Missing required fields' }, 400, request, env);
      }

      // === Sanitize ===
      const safe = (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 2000);

      const fields = {
        fair: safe(data.fair),
        name: safe(data.name),
        tel: safe(data.tel),
        email: safe(data.email),
        preferred_date: safe(data.preferred_date),
        message: safe(data.message),
        source: safe(data.source) || 'rcs/lp/lp1',
        page_url: safe(data.page_url),
        submitted_at: safe(data.submitted_at) || new Date().toISOString(),
      };

      // === Build email ===
      const subject = `【Web予約】${fields.fair} - ${fields.name}様`;

      const html = `
<!DOCTYPE html>
<html><body style="font-family:'Hiragino Mincho Pro','Yu Mincho',serif;background:#FAF6EF;padding:24px;color:#2A241D;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:6px;padding:32px;border-top:4px solid #A88A4F;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:11px;letter-spacing:.3em;color:#A88A4F;font-weight:600;">RESERVATION RECEIVED</div>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;margin:8px 0 24px;letter-spacing:.02em;">Le Diaphane フェア予約</h1>

    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.9;">
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);width:140px;color:#5C544A;">ご希望のフェア</td><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);font-weight:600;">${fields.fair}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);color:#5C544A;">お名前</td><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);font-weight:600;">${fields.name}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);color:#5C544A;">電話番号</td><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);font-weight:600;"><a href="tel:${fields.tel.replace(/[^0-9+]/g,'')}" style="color:#A88A4F;text-decoration:none;">${fields.tel}</a></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);color:#5C544A;">メールアドレス</td><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);">${fields.email ? `<a href="mailto:${fields.email}" style="color:#A88A4F;">${fields.email}</a>` : '（未入力）'}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);color:#5C544A;">ご希望日</td><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);">${fields.preferred_date || '（未入力）'}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);vertical-align:top;color:#5C544A;">ご質問・ご要望</td><td style="padding:10px 0;border-bottom:1px solid rgba(168,138,79,.2);white-space:pre-wrap;">${fields.message || '（未入力）'}</td></tr>
    </table>

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(168,138,79,.2);font-size:11px;color:#8C7B65;line-height:1.7;">
      送信元: ${fields.source}<br>
      送信URL: ${fields.page_url}<br>
      送信日時: ${fields.submitted_at}
    </div>
  </div>
</body></html>`.trim();

      const text = [
        `【Web予約】Le Diaphane フェア予約`,
        ``,
        `■ ご希望のフェア: ${fields.fair}`,
        `■ お名前: ${fields.name}`,
        `■ 電話番号: ${fields.tel}`,
        `■ メールアドレス: ${fields.email || '（未入力）'}`,
        `■ ご希望日: ${fields.preferred_date || '（未入力）'}`,
        `■ ご質問・ご要望:`,
        fields.message || '（未入力）',
        ``,
        `---`,
        `送信元: ${fields.source}`,
        `送信URL: ${fields.page_url}`,
        `送信日時: ${fields.submitted_at}`,
      ].join('\n');

      // === Send via Resend ===
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to: env.TO_EMAIL.split(',').map(s => s.trim()),
          subject,
          html,
          text,
          cc: env.CC_EMAILS ? env.CC_EMAILS.split(',').map(s => s.trim()) : undefined,
          reply_to: fields.email || undefined,
        }),
      });

      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        console.error('Resend API error:', resendRes.status, errBody);
        return jsonResponse({ error: 'Email delivery failed' }, 502, request, env);
      }

      // === Optional: auto-reply to user ===
      if (fields.email) {
        await sendAutoReply(env, fields).catch(err => console.error('Auto-reply failed:', err));
      }

      return jsonResponse({ ok: true }, 200, request, env);
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: 'Internal error' }, 500, request, env);
    }
  },
};

// === Helpers ===

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const isAllowed = allowed.some(a => origin === a || origin.endsWith('.run.app'));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : (allowed[0] || '*'),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function handleCors(request, env) {
  return new Response(null, {
    status: 204,
    headers: { ...getCorsHeaders(request, env), ...SECURITY_HEADERS },
  });
}

function jsonResponse(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request, env),
      ...SECURITY_HEADERS,
    },
  });
}

async function sendAutoReply(env, fields) {
  const subject = `【ロイヤルチェスター佐賀】ご予約を承りました`;
  const html = `
<!DOCTYPE html>
<html><body style="font-family:'Hiragino Mincho Pro','Yu Mincho',serif;background:#FAF6EF;padding:24px;color:#2A241D;line-height:1.9;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:6px;padding:32px;border-top:4px solid #A88A4F;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:11px;letter-spacing:.3em;color:#A88A4F;font-weight:600;">ROYAL CHESTER SAGA / LE DIAPHANE</div>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;margin:8px 0 24px;letter-spacing:.02em;">ご予約を承りました</h1>
    <p>${fields.name} 様</p>
    <p>このたびはル・ディアファーヌのブライダルフェアにお申し込みいただき、誠にありがとうございます。<br>
    以下の内容で承りました。担当プランナーより<strong>24時間以内</strong>にご連絡を差し上げます。</p>

    <div style="background:#FAF6EF;border-radius:4px;padding:20px;margin:24px 0;">
      <table style="width:100%;font-size:14px;">
        <tr><td style="padding:6px 0;color:#5C544A;width:120px;">フェア</td><td>${fields.fair}</td></tr>
        <tr><td style="padding:6px 0;color:#5C544A;">お名前</td><td>${fields.name}</td></tr>
        <tr><td style="padding:6px 0;color:#5C544A;">電話番号</td><td>${fields.tel}</td></tr>
        ${fields.preferred_date ? `<tr><td style="padding:6px 0;color:#5C544A;">ご希望日</td><td>${fields.preferred_date}</td></tr>` : ''}
      </table>
    </div>

    <p>お急ぎの場合や、ご予約日時の変更が必要な場合はお電話でも承ります。</p>
    <p style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:#A88A4F;font-feature-settings:'lnum' 1,'tnum' 1;">📞 0952-24-0001</p>
    <p style="font-size:12px;color:#8C7B65;">受付時間 10:00 - 19:00 / 火曜定休</p>

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(168,138,79,.2);font-size:11px;color:#8C7B65;line-height:1.7;">
      ロイヤルチェスター佐賀 / ル・ディアファーヌ<br>
      〒840-0815 佐賀県佐賀市天神1-1-28<br>
      JR佐賀駅 北口より徒歩7分
    </div>
  </div>
</body></html>`.trim();

  const text = [
    `${fields.name} 様`,
    ``,
    `このたびはル・ディアファーヌのブライダルフェアにお申し込みいただき、誠にありがとうございます。`,
    `以下の内容で承りました。担当プランナーより24時間以内にご連絡を差し上げます。`,
    ``,
    `■ フェア: ${fields.fair}`,
    `■ お名前: ${fields.name}`,
    `■ 電話番号: ${fields.tel}`,
    fields.preferred_date ? `■ ご希望日: ${fields.preferred_date}` : '',
    ``,
    `お急ぎの場合や、ご予約日時の変更が必要な場合はお電話でも承ります。`,
    `📞 0952-24-0001 (受付 10:00-19:00 / 火曜定休)`,
    ``,
    `---`,
    `ロイヤルチェスター佐賀 / ル・ディアファーヌ`,
    `〒840-0815 佐賀県佐賀市天神1-1-28`,
    `JR佐賀駅 北口より徒歩7分`,
  ].filter(Boolean).join('\n');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [fields.email],
      subject,
      html,
      text,
    }),
  });
}
