
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const now=()=>new Date().toLocaleString('pt-BR');
const defaults={
 products:[
  {id:1,code:'GLS-0001',name:'Gloss Bubble',brand:'Vivai',category:'GLS',color:'Rosa',cost:8,price:18,stock:12,min:3,sold:9},
  {id:2,code:'BAT-0001',name:'Batom Matte',brand:'Vivai',category:'BAT',color:'Vermelho',cost:7,price:16,stock:6,min:2,sold:7},
  {id:3,code:'COR-0001',name:'Corretivo Líquido',brand:'Max Love',category:'COR',color:'Bege Médio',cost:10,price:22,stock:4,min:3,sold:5},
  {id:4,code:'BDS-0001',name:'Body Splash',brand:'Essência',category:'BDS',color:'Floral',cost:18,price:39.9,stock:2,min:3,sold:8}
 ], sales:[], clients:[], gifts:[], receivables:[], audits:[], cash:{open:false,openedAt:null}, cart:[]
};
let db=JSON.parse(localStorage.getItem('essenciaDB')||'null')||defaults;
const save=()=>localStorage.setItem('essenciaDB',JSON.stringify(db));
const audit=(action)=>{db.audits.unshift({date:now(),user:'Administrador',action});db.audits=db.audits.slice(0,100);save()}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function showPage(id){
 $$('.page').forEach(p=>p.classList.toggle('active',p.id===id));
 $$('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
 $('#pageTitle').textContent=($('#nav button[data-page="'+id+'"] span')||{}).textContent||'Dashboard';
 $('#sidebar').classList.remove('open'); renderAll();
}
function calc(){
 const revenue=db.sales.reduce((a,s)=>a+s.total,0);
 const cost=db.sales.reduce((a,s)=>a+s.cost,0);
 const giftCost=db.gifts.reduce((a,g)=>a+(g.used||0)*g.cost,0);
 const profit=revenue-cost-giftCost;
 return {revenue,cost,profit,receive:db.receivables.filter(r=>!r.paid).reduce((a,r)=>a+r.value,0)};
}
function renderDashboard(){
 const c=calc(), low=db.products.filter(p=>p.stock<=p.min);
 $('#mRevenue').textContent=money(c.revenue);$('#mProfit').textContent=money(c.profit);$('#mLow').textContent=low.length;$('#mReceive').textContent=money(c.receive);
 $('#finRevenue').textContent=money(c.revenue);$('#finCost').textContent=money(c.cost);$('#finReplace').textContent=money(c.cost);$('#finProfit').textContent=money(c.profit);
 const vals=[35,62,48,80,54,92,68];
 $('#chartBars').innerHTML=vals.map((v,i)=>`<div class="bar"><i style="height:${v}%"></i><span>${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][i]}</span></div>`).join('');
 $('#topProducts').innerHTML=[...db.products].sort((a,b)=>(b.sold||0)-(a.sold||0)).slice(0,4).map((p,i)=>`<div class="list-row"><div><strong>${i+1}. ${p.name}</strong><small>${p.code} • ${p.color||'Sem cor'}</small></div><span>${p.sold||0} vendas</span></div>`).join('')||'<p>Nenhuma venda registrada.</p>';
 $('#alerts').innerHTML=(low.map(p=>`<div class="list-row"><div><strong>Estoque baixo</strong><small>${p.name} — ${p.stock} unidade(s)</small></div><span class="tag">Repor</span></div>`).join('')||'<p>Nenhum alerta no momento.</p>');
}
function productCard(p, catalog=false){return `<article class="product-card"><div class="thumb">💄</div><strong>${p.name}</strong><small>${p.brand||''} • ${p.color||'Sem cor'}</small><small>${p.code} • Estoque: ${p.stock}</small><b>${money(p.price)}</b><button onclick="addCart(${p.id})">${catalog?'Adicionar ao carrinho':'Adicionar'}</button></article>`}
function renderProducts(){
 const q=($('#productSearch')?.value||'').toLowerCase();
 $('#productTable').innerHTML=db.products.filter(p=>JSON.stringify(p).toLowerCase().includes(q)).map(p=>`<tr><td>${p.code}</td><td>${p.name}</td><td>${p.color||'-'}</td><td>${p.stock}</td><td>${money(p.price)}</td><td><button class="link-btn" onclick="removeProduct(${p.id})">Excluir</button></td></tr>`).join('');
 const sq=($('#saleSearch')?.value||'').toLowerCase();
 $('#saleProducts').innerHTML=db.products.filter(p=>p.stock>0&&JSON.stringify(p).toLowerCase().includes(sq)).map(p=>productCard(p)).join('');
 const cq=($('#catalogSearch')?.value||'').toLowerCase(), cat=$('#catalogCategory')?.value||'';
 $('#catalogProducts').innerHTML=db.products.filter(p=>p.stock>0&&(!cat||p.category===cat)&&JSON.stringify(p).toLowerCase().includes(cq)).map(p=>productCard(p,true)).join('');
 $('#stockList').innerHTML=db.products.map(p=>`<div class="list-row"><div><strong>${p.name} — ${p.color||'Sem cor'}</strong><small>${p.code} • mínimo ${p.min}</small></div><span class="tag">${p.stock} un.</span></div>`).join('');
}
window.addCart=id=>{const p=db.products.find(x=>x.id===id);if(!p||p.stock<1)return toast('Produto sem estoque');const item=db.cart.find(x=>x.id===id);if(item)item.qty++;else db.cart.push({id,qty:1});save();renderCart();toast('Produto adicionado')};
window.changeQty=(id,d)=>{const i=db.cart.find(x=>x.id===id);if(!i)return;i.qty+=d;if(i.qty<=0)db.cart=db.cart.filter(x=>x.id!==id);save();renderCart()};
function renderCart(){
 $('#cartItems').innerHTML=db.cart.map(i=>{const p=db.products.find(x=>x.id===i.id);return `<div class="cart-item"><div><strong>${p.name}</strong><small>${p.color||''} • ${money(p.price)}</small></div><div class="qty"><button onclick="changeQty(${i.id},-1)">−</button><span>${i.qty}</span><button onclick="changeQty(${i.id},1)">+</button></div></div>`}).join('')||'<p>Seu carrinho está vazio.</p>';
 const total=db.cart.reduce((a,i)=>a+db.products.find(p=>p.id===i.id).price*i.qty,0);$('#cartTotal').textContent=money(total);
}
function codeFor(cat){const nums=db.products.filter(p=>p.category===cat).map(p=>Number((p.code||'').split('-')[1])||0);return `${cat}-${String(Math.max(0,...nums)+1).padStart(4,'0')}`}
function renderClients(){$('#clientList').innerHTML=db.clients.map(c=>`<div class="list-row"><div><strong>${c.name}</strong><small>${c.phone||'Sem telefone'} • ${c.history||0} compra(s)</small></div></div>`).join('')||'<p>Nenhum cliente cadastrado.</p>'}
function renderGifts(){$('#giftList').innerHTML=db.gifts.map(g=>`<div class="list-row"><div><strong>${g.name}</strong><small>Custo ${money(g.cost)}</small></div><span>${g.stock} un.</span></div>`).join('')||'<p>Nenhum brinde cadastrado.</p>'}
function renderReceivables(){$('#receiveList').innerHTML=db.receivables.map((r,i)=>`<div class="list-row"><div><strong>${r.client||'Cliente não informado'}</strong><small>${r.date} • ${money(r.value)}</small></div><button class="btn secondary" onclick="markPaid(${i})">${r.paid?'Pago':'Marcar pago'}</button></div>`).join('')||'<p>Nenhuma conta pendente.</p>'}
window.markPaid=i=>{db.receivables[i].paid=true;audit('Conta a receber marcada como paga');renderAll()}
function renderAudit(){$('#auditList').innerHTML=db.audits.map(a=>`<div class="list-row"><div><strong>${a.action}</strong><small>${a.user} • ${a.date}</small></div></div>`).join('')||'<p>Nenhuma ação registrada.</p>'}
function renderReports(){const c=calc();$('#reportList').innerHTML=`<div class="list-row"><div><strong>Total de vendas</strong><small>${db.sales.length} venda(s)</small></div><span>${money(c.revenue)}</span></div><div class="list-row"><div><strong>Lucro real</strong><small>Receita menos custo e brindes</small></div><span>${money(c.profit)}</span></div>`}
function renderCash(){$('#cashStatus').innerHTML=db.cash.open?`<strong>Caixa aberto</strong><p>Aberto em ${db.cash.openedAt}</p>`:`<strong>Caixa fechado</strong><p>Abra o caixa para iniciar as vendas do dia.</p>`}
function renderAll(){renderDashboard();renderProducts();renderCart();renderClients();renderGifts();renderReceivables();renderAudit();renderReports();renderCash()}
$('#loginForm').addEventListener('submit',e=>{e.preventDefault();if($('#loginUser').value==='admin'&&$('#loginPass').value==='1234'){$('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');renderAll();audit('Login realizado')}else toast('Usuário ou senha inválidos')})
$('#logoutBtn').onclick=()=>location.reload();
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
$('#themeBtn').onclick=()=>document.body.classList.toggle('dark');
$$('#nav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$$('[data-go]').forEach(b=>b.onclick=()=>showPage(b.dataset.go));
$('#clearCart').onclick=()=>{db.cart=[];save();renderCart()};
$('#finishSale').onclick=()=>{if(!db.cart.length)return toast('Adicione produtos');if(!db.cash.open)return toast('Abra o caixa diário primeiro');let total=0,cost=0;for(const i of db.cart){const p=db.products.find(x=>x.id===i.id);if(i.qty>p.stock)return toast('Estoque insuficiente');p.stock-=i.qty;p.sold=(p.sold||0)+i.qty;total+=p.price*i.qty;cost+=p.cost*i.qty}const payment=$('#paymentMethod').value;db.sales.push({date:now(),total,cost,origin:$('#saleOrigin').value,payment});if(payment.includes('A receber'))db.receivables.push({date:now(),value:total,paid:false,client:''});db.cart=[];audit(`Venda finalizada: ${money(total)} via ${payment}`);renderAll();toast('Venda finalizada e estoque atualizado')};
$('#quickForm').onsubmit=e=>{e.preventDefault();const total=Number($('#quickPrice').value);db.sales.push({date:now(),total,cost:0,origin:'Loja física',payment:$('#quickPayment').value,quick:true,name:$('#quickName').value});audit(`Nota rápida registrada: ${money(total)}`);e.target.reset();renderAll();toast('Nota rápida registrada')};
$('#productForm').onsubmit=e=>{e.preventDefault();const cat=$('#pCategory').value;db.products.push({id:Date.now(),code:codeFor(cat),name:$('#pName').value,brand:$('#pBrand').value,category:cat,color:$('#pColor').value,cost:Number($('#pCost').value),price:Number($('#pPrice').value),stock:Number($('#pStock').value),min:Number($('#pMin').value),sold:0});audit('Produto cadastrado com código automático');e.target.reset();renderAll();toast('Produto cadastrado')};
window.removeProduct=id=>{db.products=db.products.filter(p=>p.id!==id);audit('Produto excluído');renderAll()}
$('#productSearch').oninput=renderProducts;$('#saleSearch').oninput=renderProducts;$('#catalogSearch').oninput=renderProducts;$('#catalogCategory').onchange=renderProducts;
$('#clientForm').onsubmit=e=>{e.preventDefault();db.clients.push({id:Date.now(),name:$('#clientName').value,phone:$('#clientPhone').value,history:0});audit('Cliente cadastrado');e.target.reset();renderClients();toast('Cliente adicionado')};
$('#giftForm').onsubmit=e=>{e.preventDefault();db.gifts.push({id:Date.now(),name:$('#giftName').value,cost:Number($('#giftCost').value),stock:Number($('#giftStock').value),used:0});audit('Brinde cadastrado');e.target.reset();renderGifts();toast('Brinde cadastrado')};
$('#openCash').onclick=()=>{db.cash={open:true,openedAt:now()};audit('Caixa diário aberto');renderCash();toast('Caixa aberto')};
$('#closeCash').onclick=()=>{db.cash={open:false,openedAt:null};audit('Caixa diário fechado');renderCash();toast('Caixa fechado')};
$('#whatsappOrder').onclick=()=>{const total=db.cart.reduce((a,i)=>a+db.products.find(p=>p.id===i.id).price*i.qty,0);const lines=db.cart.map(i=>{const p=db.products.find(x=>x.id===i.id);return `${i.qty}x ${p.name} ${p.color||''} - ${money(p.price*i.qty)}`});const text=encodeURIComponent(`Olá! Quero fazer este pedido na Essência de Mulher:\n\n${lines.join('\n')}\n\nTotal: ${money(total)}\nEntrega: Retirada / Uber Flash / SuperFrete`);window.open(`https://wa.me/?text=${text}`,'_blank')};
$('#downloadBackup').onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='backup-essencia-de-mulher.json';a.click();URL.revokeObjectURL(a.href);toast('Backup gerado')};
$('#restoreBackup').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();renderAll();audit('Backup restaurado');toast('Backup restaurado')}catch{toast('Arquivo inválido')}};r.readAsText(f)};
$('#dateText').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
renderAll();
