/* Loads AFTER the existing admin.js. Uses its authenticated Supabase client. */
(() => {
  'use strict';
  if (typeof adminSupabase === 'undefined') return;
  const db = adminSupabase;
  const host = document.getElementById('adminDashboard');
  if (!host) return;
  const root = document.createElement('section');
  root.className = 'cs-ai'; root.hidden = true;
  // Static markup only. All API/model/customer content is rendered with textContent.
  root.innerHTML = `
    <header><p class="cs-eyebrow">CLEAN SCRUB · OWNER ASSISTANT</p><h2>What can I help with today?</h2>
      <p>Talk about cars, cleaning and running your business.</p></header>
    <p id="csState" role="status" aria-live="polite"></p>
    <div class="cs-tabs" role="group" aria-label="Assistant sections">
      <button type="button" data-panel="chat" aria-pressed="true">Ask AI</button>
      <button type="button" data-panel="reports" aria-pressed="false">Daily reports</button>
      <button type="button" data-panel="emails" aria-pressed="false">Customer emails</button>
    </div>
    <section data-view="chat">
      <div class="cs-prompts">
        <button type="button" data-prompt="How do I wash a car without scratching the paint?">Wash without scratches</button>
        <button type="button" data-prompt="Help me calculate a profitable full-valet price. Ask me for the costs you need.">Work out a valet price</button>
        <button type="button" data-prompt="Draft a short Clean Scrub car-wash post with our booking link.">Write a social post</button>
      </div>
      <div id="csChatLog" class="cs-chat-log" role="log" aria-label="Owner conversation" aria-live="polite"></div>
      <form id="csChatForm"><label for="csQuestion">Ask about a car, a cleaning job or your business</label>
        <textarea id="csQuestion" rows="3" maxlength="4000" placeholder="How should I clean leather seats?" required></textarea>
        <div class="cs-actions"><button id="csSend" type="submit">Ask Clean Scrub AI</button>
          <button id="csMic" type="button">Use microphone</button>
          <button id="csRead" type="button" disabled>Read answer aloud</button>
          <button id="csClear" type="button">New chat</button></div>
      </form>
      <p id="csVoiceNote" class="cs-note"></p>
      <p class="cs-note">AI can make mistakes. Check vehicle manuals and product labels. Chat cannot send messages or change bookings. Your questions go to Cloudflare AI; avoid customer details and passwords. Chat history clears on logout or page refresh.</p>
    </section>
    <section data-view="reports" hidden><div class="cs-actions"><label for="csReportDate">Saved report</label>
      <select id="csReportDate"></select><button id="csRefreshReports" type="button">Refresh reports</button></div>
      <div id="csReport"></div></section>
    <section data-view="emails" hidden>
      <p>Save a draft, review it, then approve it for the next daily run. Sending must also be enabled in GitHub. Email only; WhatsApp is not connected.</p>
      <details><summary>Add a customer email</summary><form id="csContactForm" class="cs-form">
        <label>Name<input name="name" maxlength="120" required autocomplete="off"></label>
        <label>Email<input name="email" type="email" maxlength="254" required autocomplete="off"></label>
        <label>Service<input name="service" maxlength="160"></label>
        <label class="cs-checkbox"><input name="consent" type="checkbox"> Customer agreed to marketing emails from Clean Scrub</label>
        <label>When and how they agreed<textarea name="evidence" maxlength="1000" rows="2"></textarea></label>
        <button type="submit">Save contact</button></form></details>
      <form id="csEmailForm" class="cs-form"><h3>Create a message draft</h3>
        <label>Customer<select id="csContact" name="contact" required></select></label>
        <label>Subject<input name="subject" maxlength="180" required></label>
        <label>Message<textarea name="body" rows="5" maxlength="5000" required></textarea></label>
        <label>Send no earlier than (your device time; optional)<input name="due" type="datetime-local"></label>
        <p class="cs-note">A “Reply STOP” footer is added when sending. Check the Gmail inbox and withdraw consent here before the next run if a customer opts out.</p>
        <button type="submit">Save draft for review</button></form>
      <div class="cs-actions"><button id="csRefreshEmails" type="button">Refresh messages</button>
        <button id="csWithdraw" type="button">Withdraw selected customer’s email consent</button></div>
      <div id="csMessages"></div>
    </section>`;
  // Keep the existing dashboard heading and Sign Out controls at the top.
  const dashboardHeader = host.querySelector('.admin-dashboard-top');
  if (dashboardHeader) dashboardHeader.after(root);
  else host.prepend(root);
  const $ = id => root.querySelector('#' + id);
  const text = (tag, value, parent, cls) => {
    const el = document.createElement(tag); el.textContent = String(value ?? '');
    if (cls) el.className = cls; parent.append(el); return el;
  };
  const notice = value => { $('csState').textContent = value; };
  let generation = 0, owner = null, history = [], lastAnswer = '', busy = false, controller, recognition;
  let reports = [], contacts = [];
  const stopVoice = () => { recognition?.abort(); window.speechSynthesis?.cancel(); };
  const clearChat = () => {
    history = []; lastAnswer = ''; $('csChatLog').replaceChildren(); $('csQuestion').value = '';
    $('csRead').disabled = true; stopVoice();
  };
  function reset() {
    generation++; controller?.abort(); owner = null; root.hidden = true; clearChat();
    reports = []; contacts = []; $('csReport').replaceChildren(); $('csMessages').replaceChildren();
    $('csContact').replaceChildren(); $('csReportDate').replaceChildren();
    $('csContactForm').reset(); $('csEmailForm').reset(); busy = false; $('csSend').disabled = false; $('csClear').disabled = false;
  }
  async function syncSession(session) {
    if (!session) { reset(); return; }
    if (owner === session.user.id) return;
    reset(); const epoch = generation;
    const {data, error} = await db.from('cs_ai_admins').select('user_id').eq('user_id', session.user.id);
    if (epoch !== generation) return;
    root.hidden = false;
    if (error || !data?.length) {
      notice('AI access is not set up for this login. Complete the Supabase owner-access step.');
      root.querySelectorAll('[data-view], .cs-tabs').forEach(el => { el.hidden = true; }); return;
    }
    owner = session.user.id;
    root.querySelector('.cs-tabs').hidden = false;
    choosePanel('chat'); notice('Ready. Type a question or use the microphone.');
    loadReports(); loadEmails();
  }
  function choosePanel(name) {
    root.querySelectorAll('[data-view]').forEach(el => { el.hidden = el.dataset.view !== name; });
    root.querySelectorAll('[data-panel]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.panel === name)));
  }
  root.querySelectorAll('[data-panel]').forEach(el => el.addEventListener('click', () => choosePanel(el.dataset.panel)));
  root.querySelectorAll('[data-prompt]').forEach(el => el.addEventListener('click', () => {
    $('csQuestion').value = el.dataset.prompt; $('csQuestion').focus();
  }));
  function bubble(label, content) {
    const item = document.createElement('div'); item.className = 'cs-bubble';
    text('strong', label, item); text('p', content, item); $('csChatLog').append(item);
    $('csChatLog').scrollTop = $('csChatLog').scrollHeight;
  }
  $('csChatForm').addEventListener('submit', async event => {
    event.preventDefault(); if (!owner || busy) return;
    const question = $('csQuestion').value.trim(); if (!question) return;
    let endpoint;
    try {
      endpoint = new URL(window.CLEAN_SCRUB_AI?.chatUrl);
      if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw Error();
    } catch { notice('Owner chat needs its Cloudflare Worker URL in ai-config.js.'); return; }
    stopVoice(); busy = true; $('csSend').disabled = true; $('csClear').disabled = true;
    const epoch = generation;
    const messages = [...history, {role:'user',content:question}];
    // Keep whole user/assistant pairs, with the newest user message last.
    while (messages.length > 11 || messages.reduce((sum,m) => sum + m.content.length, 0) > 10000) {
      if (messages.length <= 1) break;
      messages.splice(0,2);
    }
    notice('Thinking…'); controller = new AbortController();
    const timer = setTimeout(() => controller?.abort(), 65000);
    try {
      const {data:{session}} = await db.auth.getSession();
      if (!session || epoch !== generation) return;
      const response = await fetch(endpoint.href, {method:'POST', headers:{'Content-Type':'application/json',
        Authorization:'Bearer ' + session.access_token}, body:JSON.stringify({messages}), signal:controller.signal});
      const result = await response.json(); if (epoch !== generation) return;
      if (!response.ok) throw Error(result.error || 'Chat request failed.');
      if (typeof result.answer !== 'string') throw Error('AI returned no answer.');
      history = [...messages, {role:'assistant',content:result.answer.slice(0,4000)}];
      bubble('You', question); bubble('Clean Scrub AI', result.answer);
      lastAnswer = result.answer; $('csQuestion').value = ''; $('csRead').disabled = !window.speechSynthesis;
      notice('Answer ready.');
    } catch (error) {
      if (epoch === generation) notice(error.name === 'AbortError' ? 'The request timed out. Your question is still here.' : error.message);
    } finally {
      clearTimeout(timer);
      if (epoch === generation) { busy = false; $('csSend').disabled = false; $('csClear').disabled = false; }
    }
  });
  $('csClear').addEventListener('click', () => { clearChat(); notice('New chat started.'); });
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Speech) {
    recognition = new Speech(); recognition.lang = 'en-ZA'; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = event => {
      if (!owner) return;
      $('csQuestion').value = ($('csQuestion').value + ' ' + event.results[0][0].transcript).trim().slice(0,4000);
      notice('Review your words, then press Ask Clean Scrub AI.');
    };
    recognition.onerror = () => notice('Microphone unavailable or permission declined. You can type your question.');
    recognition.onend = () => { $('csMic').textContent = 'Use microphone'; };
    $('csMic').addEventListener('click', () => {
      if (!owner || busy) return;
      if ($('csMic').textContent === 'Stop listening') { recognition.stop(); return; }
      try { recognition.start(); $('csMic').textContent = 'Stop listening'; notice('Listening…'); }
      catch { notice('Microphone is already in use.'); }
    });
    $('csVoiceNote').textContent = 'Microphone uses your browser’s speech service, which may process audio online. Review the words before sending.';
  } else {
    $('csMic').disabled = true; $('csVoiceNote').textContent = 'Voice input is unavailable in this browser. You can type your question.';
  }
  $('csRead').addEventListener('click', () => {
    if (!lastAnswer || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance(lastAnswer); speech.lang = 'en-ZA';
    window.speechSynthesis.speak(speech);
  });
  function download(parent, title, contents, mime, filename) {
    const button = text('button', title, parent); button.type = 'button';
    button.addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([contents], {type:mime})); const link = document.createElement('a');
      link.href=url; link.download=filename; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    });
  }
  async function loadReports() {
    if (!owner) return; const epoch = generation;
    const {data,error} = await db.from('cs_ai_reports').select('report_date,generated_at').order('report_date',{ascending:false}).limit(31);
    if (epoch !== generation) return;
    if (error) { $('csReport').textContent = 'Reports could not be loaded. Check Supabase setup.'; return; }
    reports=data || []; $('csReportDate').replaceChildren();
    for (const report of reports) { const option=text('option',report.report_date,$('csReportDate')); option.value=report.report_date; }
    if (!reports.length) { $('csReport').textContent = 'No synced reports yet. Run the daily assistant with SYNC_ADMIN enabled.'; return; }
    showReport();
  }
  async function showReport() {
    if (!owner) return; const epoch=generation; const day=$('csReportDate').value;
    $('csReport').textContent='Loading report…';
    const {data:report,error}=await db.from('cs_ai_reports').select('*').eq('report_date',day).single();
    if (epoch!==generation || day!==$('csReportDate').value) return;
    const target=$('csReport'); target.replaceChildren();
    if(error) { target.textContent='Report could not be loaded.'; return; }
    text('h3','Post caption',target); text('p',report.caption,target,'cs-pre');
    download(target,'Download caption',report.caption,'text/plain','cleanscrub-caption-'+day+'.txt');
    const encoded=report.image_base64;
    if (typeof encoded==='string' && encoded.length<=1400000 && /^\/9j\/[A-Za-z0-9+/=]+$/.test(encoded)) {
      const image=document.createElement('img'); image.src='data:image/jpeg;base64,'+encoded;
      image.alt='AI-generated Clean Scrub illustration'; image.className='cs-art'; target.append(image);
      const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
      download(target,'Download illustration',bytes,'image/jpeg','cleanscrub-post-'+day+'.jpg');
    }
    text('p',report.image_status,target,'cs-note');
    if(report.metrics) text('p',`${report.metrics.active_bookings ?? 'Unknown'} active bookings on ${report.metrics.date}. These are bookings, not revenue.`,target);
    const details=document.createElement('details'); text('summary','Full marketing draft',details); text('p',report.draft,details,'cs-pre'); target.append(details);
    if(Array.isArray(report.integration_notes)) for(const note of report.integration_notes) text('p',note,target,'cs-note');
  }
  $('csReportDate').addEventListener('change',showReport); $('csRefreshReports').addEventListener('click',loadReports);
  async function loadEmails() {
    if(!owner) return; const epoch=generation;
    const [c,m]=await Promise.all([
      db.from('cs_ai_contacts').select('id,name,email,email_consent').order('created_at',{ascending:false}).limit(200),
      db.from('cs_ai_messages').select('id,contact_id,subject,body,status,due_at').order('created_at',{ascending:false}).limit(100)
    ]);
    if(epoch!==generation) return;
    if(c.error || m.error) { $('csMessages').textContent='Customer emails could not be loaded. Check Supabase setup.'; return; }
    contacts=c.data || []; const selected=$('csContact').value; $('csContact').replaceChildren();
    for(const contact of contacts) {
      const option=text('option',`${contact.name} · ${contact.email}${contact.email_consent?'':' · NO CONSENT'}`,$('csContact')); option.value=contact.id;
    }
    if(contacts.some(c=>c.id===selected)) $('csContact').value=selected;
    const target=$('csMessages'); target.replaceChildren();
    text('p','Showing the newest 200 contacts and 100 messages. Sending is limited to 5 attempts per day.',target,'cs-note');
    for(const message of m.data || []) {
      const article=document.createElement('article'); article.className='cs-email';
      const contact=contacts.find(c=>c.id===message.contact_id);
      text('h4',message.subject,article);
      text('p',`${contact ? contact.name+' · '+contact.email : 'Older contact'} · ${message.status}`,article);
      text('p','No earlier than '+new Date(message.due_at).toLocaleString(),article,'cs-note');
      text('p',message.body,article,'cs-pre');
      if(message.status==='draft' && contact) {
        const approve=text('button','Approve email for next run',article); approve.type='button';
        approve.disabled=!contact.email_consent;
        approve.addEventListener('click',async()=> {
          if(!confirm(`Approve this email to ${contact.email}? It will be eligible for the next enabled daily run.`)) return;
          approve.disabled=true; await changeMessage('cs_ai_approve_email',message.id);
        });
      }
      if(['draft','queued'].includes(message.status)) {
        const cancel=text('button','Cancel message',article); cancel.type='button';
        cancel.addEventListener('click',async()=> { cancel.disabled=true; await changeMessage('cs_ai_cancel_email',message.id); });
      }
      if(['sending','uncertain'].includes(message.status)) text('p','Check Gmail Sent before creating another message. Automatic retries are blocked to avoid duplicates.',article,'cs-note');
      target.append(article);
    }
  }
  async function changeMessage(fn,id) {
    const {error}=await db.rpc(fn,{message_id:id});
    notice(error?'Message status could not be changed. Refresh and check consent.':'Message status updated.'); await loadEmails();
  }
  $('csContactForm').addEventListener('submit',async event=> {
    event.preventDefault(); if(!owner) return;
    const form=event.currentTarget, fields=new FormData(form), button=form.querySelector('button');
    const consent=fields.get('consent')==='on', evidence=fields.get('evidence').trim();
    if(consent && !evidence) { notice('Record when and how this customer agreed to email marketing.'); return; }
    button.disabled=true;
    try {
      const {error}=await db.from('cs_ai_contacts').insert({name:fields.get('name').trim(),email:fields.get('email').trim(),
        service:fields.get('service').trim(),email_consent:consent,consent_evidence:evidence});
      notice(error?'Contact could not be saved. Check the fields and owner access.':'Contact saved.');
      if(!error) { form.reset(); await loadEmails(); }
    } finally { button.disabled=false; }
  });
  $('csEmailForm').addEventListener('submit',async event=> {
    event.preventDefault(); if(!owner) return;
    const form=event.currentTarget, fields=new FormData(form), button=form.querySelector('button'); button.disabled=true;
    try {
      const {error}=await db.from('cs_ai_messages').insert({contact_id:fields.get('contact'),subject:fields.get('subject').trim(),
        body:fields.get('body').trim(),due_at:fields.get('due')?new Date(fields.get('due')).toISOString():new Date().toISOString()});
      notice(error?'Draft could not be saved. Check the fields and owner access.':'Draft saved. Review it below before approving.');
      if(!error) { form.reset(); await loadEmails(); }
    } finally { button.disabled=false; }
  });
  $('csWithdraw').addEventListener('click',async()=> {
    const contact=contacts.find(c=>c.id===$('csContact').value);
    if(!contact || !confirm(`Stop future marketing emails to ${contact.email}?`)) return;
    const {error}=await db.from('cs_ai_contacts').update({email_consent:false}).eq('id',contact.id);
    notice(error?'Could not withdraw consent. Try again.':'Consent withdrawn. Already accepted emails cannot be recalled.'); await loadEmails();
  });
  $('csRefreshEmails').addEventListener('click',loadEmails);
  db.auth.onAuthStateChange((_event,session) => { if(!session) reset(); else setTimeout(()=>syncSession(session),0); });
  db.auth.getSession().then(({data})=>syncSession(data.session));
})();
