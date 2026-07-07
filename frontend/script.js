// ================================================================
//  CONFIGURAÇÃO SUPABASE
// ================================================================
const SUPABASE_URL = 'https://vpihrpqvzrmixxdrqwbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ucBzmjp0Xbwi7Z-RHsk4Yg_LydKnMMZ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function hoje() { return new Date().toISOString().split('T')[0]; }
function formatarTempo(seg) {
    var m = String(Math.floor(seg / 60)).padStart(2, '0');
    var s = String(seg % 60).padStart(2, '0');
    return m + ':' + s;
}

// ================================================================
//  ESTADO GLOBAL
// ================================================================
var usuarioAtual = null;
var grupoAtual = null;
var chatGrupoSubscription = null;
var conversaAtual = null;
var conversas = [];
var usuarioNomeExibicao = '';
var usuarioIdioma = 'pt';
var modoAtual = 'smart';
var modoPai = 'estudo'; // 'estudo' ou 'cotidiano'
var topicos = [];

// ================================================================
//  DOM ELEMENTOS
// ================================================================
var telaLogin = document.getElementById('tela-login');
var appPrincipal = document.getElementById('app-principal');
var loginEmail = document.getElementById('login-email');
var loginSenha = document.getElementById('login-senha');
var loginBtn = document.getElementById('login-btn');
var loginGoogleBtn = document.getElementById('login-google-btn');
var loginMsg = document.getElementById('login-mensagem');
var mostrarCadastro = document.getElementById('mostrar-cadastro');
var mostrarRecuperar = document.getElementById('mostrar-recuperar');
var saudacaoTopo = document.getElementById('saudacao-topo');
var drawerUsuario = document.getElementById('drawer-usuario');
var btnSair = document.getElementById('btn-sair');
var modoLogin = 'entrar';

mostrarCadastro.addEventListener('click', function(e) {
    e.preventDefault();
    modoLogin = 'cadastrar';
    loginBtn.textContent = '📝 Cadastrar';
    loginMsg.innerHTML = 'Crie sua conta para começar a estudar.';
});

mostrarRecuperar.addEventListener('click', function(e) {
    e.preventDefault();
    modoLogin = 'recuperar';
    loginBtn.textContent = '📧 Recuperar Senha';
    loginMsg.textContent = 'Digite seu e-mail para receber o link de recuperação.';
});

loginBtn.addEventListener('click', async function() {
    var email = loginEmail.value.trim();
    var senha = loginSenha.value.trim();
    if (!email || !senha) {
        loginMsg.textContent = '⚠️ Preencha todos os campos.';
        loginMsg.style.color = '#F87171';
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Carregando...';

    try {
        var result;
        if (modoLogin === 'entrar') {
            result = await supabaseClient.auth.signInWithPassword({ email: email, password: senha });
        } else if (modoLogin === 'cadastrar') {
            result = await supabaseClient.auth.signUp({ email: email, password: senha });
            if (result.error && result.error.message.includes('already registered')) {
                loginMsg.textContent = '⚠️ Este e-mail já está cadastrado. Faça login.';
                loginMsg.style.color = '#F87171';
                loginBtn.disabled = false;
                loginBtn.textContent = '🚀 Entrar';
                return;
            }
            if (!result.error && result.data.user) {
                await supabaseClient.from('usuarios').upsert({
                    id: result.data.user.id,
                    nome_exibicao: email.split('@')[0],
                    idioma: 'pt'
                });
                loginMsg.textContent = '✅ Conta criada! Verifique seu e-mail para confirmar.';
                loginMsg.style.color = '#4ADE80';
                loginBtn.disabled = false;
                loginBtn.textContent = '🚀 Entrar';
                return;
            }
        } else if (modoLogin === 'recuperar') {
            result = await supabaseClient.auth.resetPasswordForEmail(email);
            if (!result.error) {
                loginMsg.textContent = '📧 Link de recuperação enviado para seu e-mail.';
                loginMsg.style.color = '#4ADE80';
                loginBtn.disabled = false;
                loginBtn.textContent = '📧 Enviado';
                return;
            }
        }

        if (result.error) throw result.error;

        usuarioAtual = result.data.user;
        loginMsg.textContent = '✅ Login realizado com sucesso!';
        loginMsg.style.color = '#4ADE80';
        entrarNoApp(usuarioAtual);
    } catch (err) {
        console.error(err);
        loginMsg.textContent = '❌ ' + (err.message || 'Erro ao autenticar.');
        loginMsg.style.color = '#F87171';
    }
    loginBtn.disabled = false;
    loginBtn.textContent = '🚀 Entrar';
});

loginGoogleBtn.addEventListener('click', async function() {
    try {
        var { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    } catch (err) {
        console.error(err);
        loginMsg.textContent = '❌ ' + err.message;
        loginMsg.style.color = '#F87171';
    }
});

supabaseClient.auth.getSession().then(function({ data }) {
    if (data.session) {
        usuarioAtual = data.session.user;
        entrarNoApp(usuarioAtual);
    }
});

btnSair.addEventListener('click', async function() {
    await supabaseClient.auth.signOut();
    usuarioAtual = null;
    grupoAtual = null;
    if (chatGrupoSubscription) {
        chatGrupoSubscription.unsubscribe();
        chatGrupoSubscription = null;
    }
    localStorage.clear();
    telaLogin.style.display = 'flex';
    appPrincipal.style.display = 'none';
});

// ================================================================
//  ENTRAR NO APP
// ================================================================
async function entrarNoApp(user) {
    telaLogin.style.display = 'none';
    appPrincipal.style.display = 'block';

    try {
        var { data, error } = await supabaseClient
            .from('usuarios')
            .select('nome_exibicao, idioma')
            .eq('id', user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            var nome = user.email.split('@')[0];
            var { error: insertError } = await supabaseClient
                .from('usuarios')
                .insert({ id: user.id, nome_exibicao: nome, idioma: 'pt' });
            if (insertError) throw insertError;
            usuarioNomeExibicao = nome;
            usuarioIdioma = 'pt';
        } else if (!error && data) {
            usuarioNomeExibicao = data.nome_exibicao || user.email.split('@')[0];
            usuarioIdioma = data.idioma || 'pt';
        } else {
            usuarioNomeExibicao = user.email.split('@')[0];
            usuarioIdioma = 'pt';
        }
    } catch (e) {
        console.error('Erro ao carregar usuário:', e);
        usuarioNomeExibicao = user.email.split('@')[0];
        usuarioIdioma = 'pt';
    }

    saudacaoTopo.innerHTML = '<strong>' + usuarioNomeExibicao + '</strong> <i class="fas fa-wave-square"></i>';
    drawerUsuario.textContent = usuarioNomeExibicao;
    window.usuarioNomeExibicao = usuarioNomeExibicao;
    window.usuarioIdioma = usuarioIdioma;

    document.getElementById('idioma-label').textContent = usuarioIdioma.toUpperCase();

    // Carregar modo pai salvo
    var modoPaiSalvo = localStorage.getItem('siriuslearn_modo_pai');
    if (modoPaiSalvo === 'cotidiano' || modoPaiSalvo === 'estudo') {
        modoPai = modoPaiSalvo;
    } else {
        modoPai = 'estudo';
    }
    atualizarToggleModo();

    carregarDadosUsuario();
    carregarConversas();
    carregarGrupoDoUsuario();
    carregarAulas();
    carregarConfiguracoes();
}

// ================================================================
//  CARREGAR DADOS DO USUÁRIO
// ================================================================
async function carregarDadosUsuario() {
    if (!usuarioAtual) return;
    carregarFlashcards();
    carregarRelatorios();
}

// ================================================================
//  CHAMAR GROQ (VIA BACKEND DA VERCEL)
// ================================================================
async function chamarGroq(prompt) {
    var url = '/api/groq';
    var resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
    });
    if (!resp.ok) {
        var erro = await resp.json();
        throw new Error('HTTP ' + resp.status + ': ' + (erro.error || 'Erro desconhecido'));
    }
    var data = await resp.json();
    var texto = data.response;
    if (!texto) throw new Error('Resposta vazia da IA');
    return texto;
}

// ================================================================
//  MODOS (INTERNOS)
// ================================================================
var modosInfo = {
    // MODO ESTUDO
    estudo_smart: {
        nome: 'Smart',
        prompt: 'Responda de forma equilibrada, adaptando a profundidade conforme a pergunta. Seja claro e objetivo.'
    },
    estudo_deeper: {
        nome: 'Think Deeper',
        prompt: 'Responda com análises aprofundadas, múltiplas perspectivas e detalhamento completo. Explore o tema em profundidade.'
    },
    estudo_learn: {
        nome: 'Estude e Aprenda',
        prompt: 'Responda com perguntas interativas, analogias e exemplos práticos. Guie o aprendizado passo a passo.'
    },
    estudo_search: {
        nome: 'Pesquisar',
        prompt: 'Responda com referências, citações e fontes confiáveis. Inclua a fonte ao final de cada informação relevante.'
    },
    // MODO COTIDIANO
    cotidiano_pratico: {
        nome: 'Prático',
        prompt: 'Responda de forma direta, prática e acionável. Foque em soluções e dicas úteis para o dia a dia.'
    },
    cotidiano_inspire: {
        nome: 'Inspire-se',
        prompt: 'Responda com motivação, encorajamento e sugestões para melhorar a rotina e o bem-estar.'
    },
    cotidiano_explique: {
        nome: 'Explique',
        prompt: 'Responda de forma simples, sem jargões, usando analogias e exemplos cotidianos.'
    },
    cotidiano_liste: {
        nome: 'Liste',
        prompt: 'Responda com listas, passos, checklists ou tópicos organizados para facilitar a ação.'
    }
};

function getModosInternos(modoPai) {
    if (modoPai === 'estudo') {
        return [
            { id: 'estudo_smart', nome: 'Smart' },
            { id: 'estudo_deeper', nome: 'Think Deeper' },
            { id: 'estudo_learn', nome: 'Estude e Aprenda' },
            { id: 'estudo_search', nome: 'Pesquisar' }
        ];
    } else {
        return [
            { id: 'cotidiano_pratico', nome: 'Prático' },
            { id: 'cotidiano_inspire', nome: 'Inspire-se' },
            { id: 'cotidiano_explique', nome: 'Explique' },
            { id: 'cotidiano_liste', nome: 'Liste' }
        ];
    }
}

function getModoPrompt(modoId) {
    return modosInfo[modoId] ? modosInfo[modoId].prompt : modosInfo.estudo_smart.prompt;
}

function getPromptModoPai(modoPai) {
    if (modoPai === 'estudo') {
        return 'Você é o SiriusLearn no modo ESTUDO. Seja didático, aprofundado e use exemplos teóricos. Responda com clareza e organização.';
    } else {
        return 'Você é o SiriusLearn no modo COTIDIANO. Seja prático, direto e use exemplos da vida real. Foque em soluções acionáveis.';
    }
}

// ================================================================
//  TOGGLE MODO ESTUDO / COTIDIANO
// ================================================================
function atualizarToggleModo() {
    var toggle = document.getElementById('modo-toggle');
    var labelEsq = document.getElementById('modo-label-esquerda');
    var labelDir = document.getElementById('modo-label-direita');

    if (toggle) {
        toggle.checked = (modoPai === 'cotidiano');
    }
    if (labelEsq) {
        labelEsq.classList.toggle('ativo', modoPai === 'estudo');
    }
    if (labelDir) {
        labelDir.classList.toggle('ativo', modoPai === 'cotidiano');
    }

    // Atualizar o dropdown de modos internos
    atualizarModosInternos();
    localStorage.setItem('siriuslearn_modo_pai', modoPai);
}

function atualizarModosInternos() {
    var select = document.getElementById('modo-select');
    if (!select) return;
    var modos = getModosInternos(modoPai);
    var currentValue = select.value;
    // Verificar se o valor atual ainda é válido
    var valido = modos.some(function(m) { return m.id === currentValue; });
    if (!valido) {
        currentValue = modos[0].id;
    }
    select.innerHTML = '';
    modos.forEach(function(m) {
        var opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.nome;
        select.appendChild(opt);
    });
    select.value = currentValue || modos[0].id;
    modoAtual = select.value;
}

document.getElementById('modo-toggle').addEventListener('change', function() {
    if (this.checked) {
        modoPai = 'cotidiano';
    } else {
        modoPai = 'estudo';
    }
    atualizarToggleModo();
    // Mudar saudação? Não – mantemos a mesma.
});

// ================================================================
//  CONFIGURAÇÕES
// ================================================================
async function carregarConfiguracoes() {
    var selectIdioma = document.getElementById('config-idioma');
    if (selectIdioma) {
        selectIdioma.value = usuarioIdioma;
        selectIdioma.removeEventListener('change', onIdiomaChange);
        selectIdioma.addEventListener('change', onIdiomaChange);
    }

    var btnEditarNome = document.getElementById('btn-editar-nome');
    if (btnEditarNome) {
        btnEditarNome.removeEventListener('click', criarModalNome);
        btnEditarNome.addEventListener('click', criarModalNome);
    }

    var btnAlterarSenha = document.getElementById('btn-alterar-senha');
    if (btnAlterarSenha) {
        btnAlterarSenha.addEventListener('click', function() {
            alert('Funcionalidade em desenvolvimento. Em breve você poderá alterar sua senha.');
        });
    }

    var modoSelect = document.getElementById('modo-select');
    if (modoSelect) {
        modoSelect.removeEventListener('change', onModoChange);
        modoSelect.addEventListener('change', onModoChange);
        // Inicializar com o modo atual
        var modos = getModosInternos(modoPai);
        if (modos.length > 0) {
            modoSelect.value = modos[0].id;
            modoAtual = modoSelect.value;
        }
    }

    // Inicializar toggle com o estado salvo
    atualizarToggleModo();
}

function onIdiomaChange(e) {
    usuarioIdioma = e.target.value;
    salvarConfiguracao('idioma', usuarioIdioma);
    document.getElementById('idioma-label').textContent = usuarioIdioma.toUpperCase();
}

function onModoChange(e) {
    modoAtual = e.target.value;
}

async function salvarConfiguracao(chave, valor) {
    if (!usuarioAtual) return;
    try {
        var obj = {};
        obj[chave] = valor;
        await supabaseClient
            .from('usuarios')
            .update(obj)
            .eq('id', usuarioAtual.id);
    } catch (e) {
        console.error('Erro ao salvar configuração:', e);
    }
}

// ================================================================
//  MODAL DE NOME
// ================================================================
function criarModalNome() {
    var overlay = document.createElement('div');
    overlay.id = 'modal-nome';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);';
    overlay.innerHTML = '<div style="background:var(--bg-card); border-radius:20px; padding:32px; max-width:400px; width:90%; border:1px solid var(--border-color); box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);"><h3 style="margin-bottom:8px; color:var(--text-primary);"><i class="fas fa-pencil-alt"></i> Editar Nome</h3><p style="color:var(--text-muted); font-size:14px; margin-bottom:16px;">Como você quer ser chamado?</p><input type="text" id="input-novo-nome" placeholder="Digite seu novo nome" value="' + usuarioNomeExibicao + '" style="width:100%; padding:12px 16px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:12px; color:var(--text-primary); font-size:16px; margin-bottom:16px;"><div style="display:flex; gap:10px;"><button onclick="salvarNomeUsuario()" style="flex:1; background:var(--cor-gradiente); color:white; border:none; padding:12px; border-radius:12px; font-weight:600; cursor:pointer;"><i class="fas fa-save"></i> Salvar</button><button onclick="fecharModalNome()" style="flex:1; background:var(--bg-secondary); color:var(--text-muted); border:1px solid var(--border-color); padding:12px; border-radius:12px; font-weight:600; cursor:pointer;">Cancelar</button></div></div>';
    document.body.appendChild(overlay);
    document.getElementById('input-novo-nome').focus();
}

window.fecharModalNome = function() {
    var modal = document.getElementById('modal-nome');
    if (modal) modal.remove();
};

window.salvarNomeUsuario = async function() {
    var input = document.getElementById('input-novo-nome');
    var nome = input.value.trim();
    if (!nome) { alert('Digite um nome válido.'); return; }

    try {
        var { data, error } = await supabaseClient
            .from('usuarios')
            .upsert({ id: usuarioAtual.id, nome_exibicao: nome })
            .select();
        if (error) throw error;
        console.log('Nome salvo com sucesso:', data);

        usuarioNomeExibicao = nome;
        window.usuarioNomeExibicao = nome;
        saudacaoTopo.innerHTML = '<strong>' + nome + '</strong> <i class="fas fa-wave-square"></i>';
        drawerUsuario.textContent = nome;
        fecharModalNome();
        alert('✅ Nome atualizado com sucesso!');
    } catch (e) {
        console.error('Erro ao salvar nome:', e);
        alert('Erro ao salvar nome. Verifique o console.');
    }
};

// ================================================================
//  SAUDAÇÃO CENTRALIZADA
// ================================================================
function mostrarSaudacaoIA() {
    var chatMsg = document.getElementById('chat-mensagens');
    chatMsg.innerHTML = '';
    var saudacaoContainer = document.getElementById('saudacao-container');
    if (saudacaoContainer) {
        saudacaoContainer.style.display = 'flex';
    }
}

// ================================================================
//  MENSAGENS E STREAMING
// ================================================================
async function adicionarMensagemStreaming(texto, tipo, fontes) {
    var chatMsg = document.getElementById('chat-mensagens');
    var div = document.createElement('div');
    div.className = 'mensagem ' + tipo;
    chatMsg.appendChild(div);
    chatMsg.scrollTop = chatMsg.scrollHeight;

    var palavras = texto.split(' ');
    var html = '';
    for (var i = 0; i < palavras.length; i++) {
        html += palavras[i] + ' ';
        div.innerHTML = formatarMarkdown(html);
        chatMsg.scrollTop = chatMsg.scrollHeight;
        await new Promise(function(r) { setTimeout(r, 30); });
    }
    if (fontes && fontes.length) {
        var fontesHtml = '<div class="fontes"><i class="fas fa-book"></i> <strong>Fontes:</strong><br>' + fontes.join('<br>') + '</div>';
        div.innerHTML += fontesHtml;
    }
}

function adicionarMensagemLocal(texto, tipo) {
    var chatMsg = document.getElementById('chat-mensagens');
    var div = document.createElement('div');
    div.className = 'mensagem ' + tipo;
    div.innerHTML = texto;
    chatMsg.appendChild(div);
    chatMsg.scrollTop = chatMsg.scrollHeight;
    // Oculta saudação centralizada quando há mensagens
    var saudacaoContainer = document.getElementById('saudacao-container');
    if (saudacaoContainer) {
        saudacaoContainer.style.display = 'none';
    }
}

function mostrarDigitando() {
    var chatMsg = document.getElementById('chat-mensagens');
    var div = document.createElement('div');
    div.className = 'mensagem ia digitando-indicator';
    div.id = 'digitando-indicator';
    div.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatMsg.appendChild(div);
    chatMsg.scrollTop = chatMsg.scrollHeight;
    return div;
}

function removerDigitando(el) {
    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
    }
}

// ================================================================
//  FORMATAR MARKDOWN
// ================================================================
function formatarMarkdown(texto) {
    if (!texto) return '';
    var html = texto;

    html = html.replace(/^### (.*)/gm, '<h5>$1</h5>');
    html = html.replace(/^## (.*)/gm, '<h4>$1</h4>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^\* (.*)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^\d+\. (.*)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, function(match) {
        if (!match.includes('<ul>')) return '<ol>' + match + '</ol>';
        return match;
    });
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/^> (.*)/gm, '<blockquote>$1</blockquote>');

    var lines = html.split('\n');
    var inTable = false;
    var tableRows = [];
    var newLines = [];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableRows = [];
            }
            if (line.match(/^\|[\s\-:|]+\|$/)) {
                continue;
            }
            tableRows.push(line);
        } else {
            if (inTable) {
                if (tableRows.length > 0) {
                    var tableHtml = '<table>';
                    tableRows.forEach(function(row, ri) {
                        var cells = row.split('|').filter(function(c) { return c.trim() !== ''; });
                        if (cells.length === 0) return;
                        tableHtml += '<tr>';
                        cells.forEach(function(cell) {
                            var tag = ri === 0 ? 'th' : 'td';
                            tableHtml += '<' + tag + '>' + cell.trim() + '</' + tag + '>';
                        });
                        tableHtml += '</tr>';
                    });
                    tableHtml += '</table>';
                    newLines.push(tableHtml);
                }
                inTable = false;
                tableRows = [];
            }
            newLines.push(line);
        }
    }
    if (inTable && tableRows.length > 0) {
        var tableHtml = '<table>';
        tableRows.forEach(function(row, ri) {
            var cells = row.split('|').filter(function(c) { return c.trim() !== ''; });
            if (cells.length === 0) return;
            tableHtml += '<tr>';
            cells.forEach(function(cell) {
                var tag = ri === 0 ? 'th' : 'td';
                tableHtml += '<' + tag + '>' + cell.trim() + '</' + tag + '>';
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</table>';
        newLines.push(tableHtml);
    }

    html = newLines.join('\n');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    if (!html.startsWith('<') && !html.startsWith('</')) {
        html = '<p>' + html + '</p>';
    }
    return html;
}

// ================================================================
//  COMANDOS POR PALAVRAS-CHAVE
// ================================================================
function detectarComando(texto) {
    var lower = texto.toLowerCase().trim();
    var palavras = lower.split(' ');
    
    if (lower === 'resumo' || lower === 'gerar resumo' || lower === 'sumário') return 'resumo';
    if (lower === 'planilha' || lower === 'csv' || lower === 'gerar planilha') return 'csv';
    if (lower === 'upload' || lower === 'enviar pdf' || lower === 'anexar') return 'upload';
    
    if (palavras.length >= 2 && palavras[0] === 'gerar') {
        if (palavras[1] === 'resumo' || palavras[1] === 'sumário') return 'resumo';
        if (palavras[1] === 'planilha' || palavras[1] === 'csv') return 'csv';
    }
    
    return null;
}

// ================================================================
//  GERAR RESUMO, CSV
// ================================================================
function gerarResumo() {
    var mensagens = document.querySelectorAll('#chat-mensagens .mensagem:not(.digitando-indicator)');
    var texto = '';
    mensagens.forEach(function(m) {
        var tipo = m.classList.contains('usuario') ? 'Você' : 'SiriusLearn';
        var txt = m.textContent.trim();
        if (txt && !txt.includes('Arquivo')) {
            texto += tipo + ': ' + txt + '\n\n';
        }
    });
    var blob = new Blob([texto], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'resumo-siriuslearn.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function gerarCSV() {
    var mensagens = document.querySelectorAll('#chat-mensagens .mensagem:not(.digitando-indicator)');
    var linhas = ['Tipo,Mensagem'];
    mensagens.forEach(function(m) {
        var tipo = m.classList.contains('usuario') ? 'Usuário' : 'IA';
        var txt = m.textContent.trim();
        if (txt && !txt.includes('Arquivo')) {
            linhas.push(tipo + ',' + txt.replace(/,/g, ';'));
        }
    });
    var csv = linhas.join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'conversa-siriuslearn.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ================================================================
//  TÓPICOS DA CONVERSA
// ================================================================
function adicionarTopico(pergunta) {
    if (topicos.some(function(t) { return t === pergunta; })) return;
    topicos.push(pergunta);
    renderizarTopicos();
}

function renderizarTopicos() {
    var container = document.getElementById('lista-topicos');
    if (!container) return;
    if (topicos.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;"><i class="fas fa-comment-slash"></i> Nenhum tópico ainda.</p>';
        return;
    }
    var html = '';
    topicos.forEach(function(topico, index) {
        html += '<div class="topico-item" onclick="scrollParaTopico(' + index + ')">' +
                '<i class="fas fa-comment"></i> ' + topico + '</div>';
    });
    container.innerHTML = html;
}

function scrollParaTopico(index) {
    var mensagens = document.querySelectorAll('#chat-mensagens .mensagem.usuario');
    if (mensagens[index]) {
        mensagens[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelectorAll('.topico-item').forEach(function(el, i) {
            el.classList.toggle('active', i === index);
        });
    }
}

// ================================================================
//  ENVIAR PERGUNTA
// ================================================================
var chatInput = document.getElementById('chat-input');
var btnChat = document.getElementById('btn-chat-enviar');

async function enviarPergunta(pergunta) {
    if (!pergunta.trim() || !conversaAtual) return;

    var comando = detectarComando(pergunta);
    if (comando) {
        if (comando === 'resumo') {
            gerarResumo();
            return;
        } else if (comando === 'csv') {
            gerarCSV();
            return;
        } else if (comando === 'upload') {
            document.getElementById('btn-upload-pdf').click();
            return;
        }
    }

    adicionarMensagemLocal(pergunta, 'usuario');
    adicionarTopico(pergunta);
    chatInput.value = '';
    await salvarMensagem(conversaAtual.id, pergunta, 'usuario');

    var loading = mostrarDigitando();

    try {
        var modoPrompt = getModoPrompt(modoAtual);
        var promptModoPai = getPromptModoPai(modoPai);
        var idiomaNome = usuarioIdioma === 'pt' ? 'português' : usuarioIdioma === 'en' ? 'inglês' : 'espanhol';
        var systemPrompt = promptModoPai + ' ' + modoPrompt + ' Responda SEMPRE em ' + idiomaNome + '.';
        var promptCompleto = systemPrompt + ' Pergunta: ' + pergunta;
        var resp = await chamarGroq(promptCompleto);
        removerDigitando(loading);

        var fontes = [];
        if (modoAtual === 'estudo_search' || modoAtual === 'cotidiano_pesquisar') {
            var fontesMatch = resp.match(/(Fonte[s]?|Referência[s]?|Baseado em):\s*(.*?)(?=\n\n|$)/gi);
            if (fontesMatch) {
                fontes = fontesMatch.map(function(f) { return f.trim(); });
            }
            var textoLimpo = resp.replace(/(Fonte[s]?|Referência[s]?|Baseado em):\s*(.*?)(?=\n\n|$)/gi, '');
            await adicionarMensagemStreaming(textoLimpo, 'ia', fontes);
        } else {
            await adicionarMensagemStreaming(resp, 'ia');
        }
        await salvarMensagem(conversaAtual.id, resp, 'ia');
    } catch (e) {
        removerDigitando(loading);
        var erroDiv = document.createElement('div');
        erroDiv.className = 'mensagem ia';
        erroDiv.innerHTML = '<i class="fas fa-times-circle" style="color:#F87171;"></i> <em>Erro ao obter resposta. Tente novamente.</em>';
        erroDiv.style.borderLeftColor = '#F87171';
        document.getElementById('chat-mensagens').appendChild(erroDiv);
        console.error(e);
    }
    btnChat.disabled = false;
}

btnChat.addEventListener('click', function() {
    enviarPergunta(chatInput.value);
});
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') enviarPergunta(chatInput.value);
});

document.getElementById('btn-upload-pdf').addEventListener('click', function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(ev) {
                var texto = '📄 Arquivo "' + file.name + '" enviado. O que você gostaria de saber sobre ele?';
                adicionarMensagemLocal(texto, 'usuario');
                salvarMensagem(conversaAtual.id, texto, 'usuario');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// ================================================================
//  MODAL DE IDIOMA
// ================================================================
document.getElementById('btn-idioma').addEventListener('click', function() {
    var select = document.getElementById('config-idioma');
    if (select) {
        select.focus();
        select.click();
        document.getElementById('tab-configuracoes').scrollIntoView({ behavior: 'smooth' });
        document.querySelector('.drawer-item[data-tab="configuracoes"]').click();
    }
});

// ================================================================
//  CONVERSAS
// ================================================================
document.getElementById('btn-nova-conversa').addEventListener('click', async function() {
    await criarNovaConversa('Nova conversa');
});
document.getElementById('btn-nova-conversa-drawer').addEventListener('click', async function() {
    await criarNovaConversa('Nova conversa');
});

async function carregarConversas() {
    if (!usuarioAtual) return;
    try {
        var { data, error } = await supabaseClient
            .from('conversas')
            .select('id, titulo, created_at')
            .eq('usuario_id', usuarioAtual.id)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        conversas = data || [];
        if (conversas.length === 0) {
            await criarNovaConversa('Nova conversa');
        } else {
            conversaAtual = conversas[0];
            renderizarListaConversas();
            carregarMensagensConversa(conversaAtual.id);
        }
    } catch (e) {
        console.error('Erro ao carregar conversas:', e);
    }
}

async function criarNovaConversa(titulo) {
    titulo = titulo || 'Nova conversa';
    if (!usuarioAtual) return;
    try {
        var { data, error } = await supabaseClient
            .from('conversas')
            .insert({
                usuario_id: usuarioAtual.id,
                titulo: titulo,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        if (error) throw error;
        conversas.unshift(data);
        conversaAtual = data;
        renderizarListaConversas();
        document.getElementById('chat-mensagens').innerHTML = '';
        topicos = [];
        renderizarTopicos();
        mostrarSaudacaoIA();
    } catch (e) {
        console.error('Erro ao criar conversa:', e);
    }
}

async function gerarTituloConversa(primeiraMensagem) {
    if (!primeiraMensagem || primeiraMensagem.length < 5) return 'Nova conversa';
    try {
        var prompt = 'Gere um título curto (máx 5 palavras) para uma conversa que começa com: "' + primeiraMensagem + '". Retorne apenas o título, sem aspas.';
        var titulo = await chamarGroq(prompt);
        return titulo.trim().substring(0, 50);
    } catch (e) {
        var palavras = primeiraMensagem.split(' ').slice(0, 4).join(' ');
        return palavras.length > 5 ? palavras : 'Nova conversa';
    }
}

async function atualizarTituloConversa(conversaId, novoTitulo) {
    if (!conversaId || !novoTitulo) return;
    try {
        await supabaseClient
            .from('conversas')
            .update({ titulo: novoTitulo, updated_at: new Date().toISOString() })
            .eq('id', conversaId);
        var conv = conversas.find(function(c) { return c.id === conversaId; });
        if (conv) conv.titulo = novoTitulo;
        renderizarListaConversas();
    } catch (e) { console.error('Erro ao atualizar título:', e); }
}

async function deletarConversa(id) {
    if (!confirm('Deseja deletar esta conversa?')) return;
    if (!usuarioAtual) {
        alert('Você precisa estar logado.');
        return;
    }
    try {
        var { error } = await supabaseClient
            .from('conversas')
            .delete()
            .eq('id', id)
            .eq('usuario_id', usuarioAtual.id);
        if (error) throw error;
        conversas = conversas.filter(function(c) { return c.id !== id; });
        if (conversaAtual && conversaAtual.id === id) {
            conversaAtual = conversas[0] || null;
            if (conversaAtual) {
                carregarMensagensConversa(conversaAtual.id);
            } else {
                await criarNovaConversa('Nova conversa');
            }
        }
        renderizarListaConversas();
    } catch (e) {
        console.error('Erro ao deletar conversa:', e);
        alert('Erro ao deletar conversa. Verifique o console.');
    }
}

async function alternarConversa(id) {
    console.log('Alternando para conversa:', id);
    var conv = conversas.find(function(c) { return c.id === id; });
    if (!conv) {
        console.error('Conversa não encontrada:', id);
        return;
    }
    conversaAtual = conv;
    renderizarListaConversas();
    await carregarMensagensConversa(id);
    if (window.innerWidth <= 768) {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
    }
    topicos = [];
    renderizarTopicos();
    var { data, error } = await supabaseClient
        .from('mensagens')
        .select('*')
        .eq('conversa_id', id)
        .order('created_at', { ascending: true });
    if (!error && data) {
        data.forEach(function(msg) {
            if (msg.tipo === 'usuario') {
                adicionarTopico(msg.texto);
            }
        });
    }
}

window.deletarConversa = deletarConversa;
window.alternarConversa = alternarConversa;

function renderizarListaConversas() {
    var container = document.getElementById('lista-conversas');
    if (!container) return;
    if (conversas.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;"><i class="fas fa-comment-slash"></i> Nenhuma conversa</p>';
        return;
    }
    var html = '';
    conversas.forEach(function(c) {
        var active = conversaAtual && conversaAtual.id === c.id ? 'active' : '';
        html += '<div class="conversa-item ' + active + '" onclick="alternarConversa(\'' + c.id + '\')">';
        html += '<span><i class="fas fa-comment"></i> ' + (c.titulo || 'Conversa') + '</span>';
        html += '<button class="btn-delete-conversa" onclick="event.stopPropagation(); deletarConversa(\'' + c.id + '\')"><i class="fas fa-trash-alt"></i></button>';
        html += '</div>';
    });
    container.innerHTML = html;
}

async function carregarMensagensConversa(conversaId) {
    if (!conversaId) return;
    try {
        var { data, error } = await supabaseClient
            .from('mensagens')
            .select('*')
            .eq('conversa_id', conversaId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        var chatMsg = document.getElementById('chat-mensagens');
        chatMsg.innerHTML = '';
        if (!data || data.length === 0) {
            mostrarSaudacaoIA();
            return;
        }
        var saudacaoContainer = document.getElementById('saudacao-container');
        if (saudacaoContainer) {
            saudacaoContainer.style.display = 'none';
        }
        data.forEach(function(msg) {
            var div = document.createElement('div');
            div.className = 'mensagem ' + msg.tipo;
            if (msg.tipo === 'ia') {
                div.innerHTML = formatarMarkdown(msg.texto);
            } else {
                div.textContent = msg.texto;
            }
            chatMsg.appendChild(div);
        });
        chatMsg.scrollTop = chatMsg.scrollHeight;
    } catch (e) {
        console.error('Erro ao carregar mensagens:', e);
    }
}

async function salvarMensagem(conversaId, texto, tipo) {
    if (!conversaId || !usuarioAtual) return;
    try {
        await supabaseClient
            .from('mensagens')
            .insert({
                conversa_id: conversaId,
                usuario_id: usuarioAtual.id,
                texto: texto,
                tipo: tipo,
                created_at: new Date().toISOString()
            });
        await supabaseClient
            .from('conversas')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversaId);
    } catch (e) {
        console.error('Erro ao salvar mensagem:', e);
    }
}

// ================================================================
//  DRAWER E NAVEGAÇÃO
// ================================================================
var drawer = document.getElementById('drawer');
var overlay = document.getElementById('drawer-overlay');

document.getElementById('btn-menu-toggle').addEventListener('click', function() {
    drawer.classList.add('open');
    overlay.classList.add('show');
});
document.getElementById('btn-close-drawer').addEventListener('click', function() {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
});
overlay.addEventListener('click', function() {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
});

document.querySelectorAll('.drawer-item').forEach(function(item) {
    item.addEventListener('click', function() {
        document.querySelectorAll('.drawer-item').forEach(function(i) { i.classList.remove('active'); });
        this.classList.add('active');
        var tab = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
        document.getElementById('tab-' + tab).classList.add('active');
        drawer.classList.remove('open');
        overlay.classList.remove('show');
        if (tab === 'chat') {
            if (!conversaAtual && conversas.length === 0) {
                criarNovaConversa('Nova conversa');
            }
        }
        if (tab === 'flashcards') carregarFlashcards();
        if (tab === 'relatorios') carregarRelatorios();
        if (tab === 'configuracoes') carregarConfiguracoes();
    });
});

document.addEventListener('DOMContentLoaded', function() {
    carregarRanking();
    carregarFlashcards();
    carregarRelatorios();
    document.getElementById('idioma-label').textContent = usuarioIdioma ? usuarioIdioma.toUpperCase() : 'PT';
});

// ================================================================
//  GRUPOS (mantido)
// ================================================================
async function carregarGrupoDoUsuario() {
    if (!usuarioAtual) return;
    try {
        var { data, error } = await supabaseClient
            .from('membros_grupo')
            .select('grupo_id, grupos(*)')
            .eq('usuario_id', usuarioAtual.id)
            .maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
            grupoAtual = data.grupos;
            mostrarGrupoAtual(grupoAtual);
        }
    } catch (e) {
        console.error('Erro ao carregar grupo:', e);
    }
}

function mostrarGrupoAtual(grupo) {
    var div = document.getElementById('meu-grupo-info');
    if (!div) return;
    div.style.display = 'block';
    document.getElementById('grupo-nome-exibido').textContent = '📌 ' + grupo.nome;
    document.getElementById('grupo-desc-exibido').textContent = grupo.descricao || 'Sem descrição';
    document.getElementById('grupo-codigo-exibido').textContent = grupo.codigo_convite;

    var containerMembros = document.getElementById('membros-grupo-lista');
    if (!containerMembros) {
        var newContainer = document.createElement('div');
        newContainer.id = 'membros-grupo-lista';
        newContainer.style.marginTop = '8px';
        newContainer.innerHTML = '<p style="color:#94A3B8;"><i class="fas fa-spinner fa-spin"></i> Carregando membros...</p>';
        div.insertBefore(newContainer, div.querySelector('hr'));
    }

    carregarMembrosGrupo(grupo.id);
    carregarRankingGrupo(grupo.id, 'semanal');
    carregarChatGrupo(grupo.id);
}

async function carregarMembrosGrupo(grupoId) {
    try {
        var { data: membros, error } = await supabaseClient
            .from('membros_grupo')
            .select('usuario_id')
            .eq('grupo_id', grupoId);
        if (error) throw error;
        var container = document.getElementById('membros-grupo-lista');
        if (!membros || membros.length === 0) {
            container.innerHTML = '<p style="color:#94A3B8;"><i class="fas fa-users"></i> Nenhum membro.</p>';
            return;
        }
        var userIds = membros.map(function(m) { return m.usuario_id; });
        var { data: usuarios, error: err2 } = await supabaseClient
            .from('usuarios')
            .select('id, nome_exibicao')
            .in('id', userIds);
        if (err2) throw err2;
        var nomeMap = {};
        usuarios.forEach(function(u) { nomeMap[u.id] = u.nome_exibicao || 'Usuário'; });
        var html = '<div style="display:flex; flex-wrap:wrap; gap:8px;">';
        membros.forEach(function(m) {
            var nome = nomeMap[m.usuario_id] || 'Usuário';
            html += '<span style="background:#1A1F2E; padding:4px 12px; border-radius:20px; border:1px solid #2D3448; font-size:13px;"><i class="fas fa-user"></i> ' + nome + '</span>';
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        console.error('Erro ao carregar membros:', e);
        var container = document.getElementById('membros-grupo-lista');
        if (container) container.innerHTML = '<p style="color:#F87171;"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar membros.</p>';
    }
}

document.getElementById('btn-criar-grupo').addEventListener('click', async function() {
    var nome = document.getElementById('grupo-nome').value.trim();
    var descricao = document.getElementById('grupo-descricao').value.trim();
    if (!nome) { alert('Digite um nome para o grupo.'); return; }
    var codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
        var { data, error } = await supabaseClient.from('grupos').insert({
            nome: nome,
            descricao: descricao,
            codigo_convite: codigo,
            criador_id: usuarioAtual.id
        }).select().single();
        if (error) throw error;
        await supabaseClient.from('membros_grupo').insert({
            grupo_id: data.id,
            usuario_id: usuarioAtual.id
        });
        grupoAtual = data;
        mostrarGrupoAtual(data);
        alert('✅ Grupo "' + nome + '" criado! Código: ' + codigo);
    } catch (e) {
        alert('Erro ao criar grupo.');
        console.error(e);
    }
});

document.getElementById('btn-entrar-grupo').addEventListener('click', async function() {
    var codigo = document.getElementById('grupo-convite').value.trim().toUpperCase();
    if (!codigo) { alert('Digite o código de convite.'); return; }
    try {
        var { data, error } = await supabaseClient
            .from('grupos')
            .select('*')
            .eq('codigo_convite', codigo)
            .single();
        if (error) throw error;
        await supabaseClient.from('membros_grupo').insert({
            grupo_id: data.id,
            usuario_id: usuarioAtual.id
        });
        grupoAtual = data;
        mostrarGrupoAtual(data);
        alert('✅ Entrou no grupo "' + data.nome + '"!');
    } catch (e) {
        alert('Código inválido ou grupo não encontrado.');
        console.error(e);
    }
});

document.getElementById('btn-sair-grupo').addEventListener('click', async function() {
    if (!grupoAtual || !usuarioAtual) return;
    if (!confirm('Sair do grupo "' + grupoAtual.nome + '"?')) return;
    try {
        await supabaseClient
            .from('membros_grupo')
            .delete()
            .eq('grupo_id', grupoAtual.id)
            .eq('usuario_id', usuarioAtual.id);
        grupoAtual = null;
        document.getElementById('meu-grupo-info').style.display = 'none';
        alert('Você saiu do grupo.');
    } catch (e) {
        alert('Erro ao sair do grupo.');
        console.error(e);
    }
});

var rankingPeriodo = 'semanal';

document.getElementById('btn-ranking-semanal').addEventListener('click', function() {
    rankingPeriodo = 'semanal';
    if (grupoAtual) carregarRankingGrupo(grupoAtual.id, 'semanal');
});
document.getElementById('btn-ranking-mensal').addEventListener('click', function() {
    rankingPeriodo = 'mensal';
    if (grupoAtual) carregarRankingGrupo(grupoAtual.id, 'mensal');
});

async function carregarRankingGrupo(grupoId, periodo) {
    if (!grupoId) return;
    try {
        var dataInicio = new Date();
        if (periodo === 'semanal') {
            dataInicio.setDate(dataInicio.getDate() - 7);
        } else {
            dataInicio.setMonth(dataInicio.getMonth() - 1);
        }
        var inicioStr = dataInicio.toISOString();
        var { data: sessoes, error } = await supabaseClient
            .from('sessoes')
            .select('usuario_id, duracao')
            .eq('grupo_id', grupoId)
            .gte('created_at', inicioStr);
        if (error) throw error;
        var rankingMap = {};
        sessoes.forEach(function(s) {
            var uid = s.usuario_id;
            if (!rankingMap[uid]) rankingMap[uid] = 0;
            rankingMap[uid] += s.duracao || 0;
        });
        var userIds = Object.keys(rankingMap);
        var div = document.getElementById('ranking-grupo-lista');
        if (userIds.length === 0) {
            div.innerHTML = '<p style="color:#94A3B8;"><i class="fas fa-chart-simple"></i> Nenhum estudo registrado neste período.</p>';
            return;
        }
        var { data: usuarios, error: err2 } = await supabaseClient
            .from('usuarios')
            .select('id, nome_exibicao')
            .in('id', userIds);
        if (err2) throw err2;
        var nomeMap = {};
        usuarios.forEach(function(u) { nomeMap[u.id] = u.nome_exibicao || 'Usuário'; });
        var ranking = userIds.map(function(uid) {
            return { nome: nomeMap[uid] || 'Usuário', total: rankingMap[uid] };
        });
        ranking.sort(function(a, b) { return b.total - a.total; });
        var html = '';
        ranking.forEach(function(item, i) {
            var medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1) + 'º';
            html += '<div class="ranking-item"><span class="pos">' + medalha + '</span><span class="nome"><i class="fas fa-user"></i> ' + item.nome + '</span><span class="min">' + item.total + ' min</span></div>';
        });
        div.innerHTML = html;
    } catch (e) {
        console.error('Erro ao carregar ranking:', e);
        var div = document.getElementById('ranking-grupo-lista');
        if (div) div.innerHTML = '<p style="color:#F87171;"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar ranking.</p>';
    }
}

async function carregarChatGrupo(grupoId) {
    var container = document.getElementById('chat-grupo-mensagens');
    if (!container) return;
    try {
        var { data, error } = await supabaseClient
            .from('mensagens_grupo')
            .select('*')
            .eq('grupo_id', grupoId)
            .order('created_at', { ascending: true })
            .limit(50);
        if (error) throw error;
        container.innerHTML = '';
        data.forEach(function(msg) {
            var div = document.createElement('div');
            div.className = 'msg-grupo';
            div.innerHTML = '<i class="fas fa-user-circle"></i> <strong>' + (msg.usuario_email || 'Usuário') + '</strong>: ' + msg.texto + ' <span class="time">' + new Date(msg.created_at).toLocaleTimeString() + '</span>';
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        console.error('Erro ao carregar mensagens do grupo:', e);
    }
    if (chatGrupoSubscription) {
        chatGrupoSubscription.unsubscribe();
        chatGrupoSubscription = null;
    }
    chatGrupoSubscription = supabaseClient
        .channel('mensagens_grupo')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'mensagens_grupo',
            filter: 'grupo_id=eq.' + grupoId
        }, function(payload) {
            var msg = payload.new;
            var div = document.createElement('div');
            div.className = 'msg-grupo';
            div.innerHTML = '<i class="fas fa-user-circle"></i> <strong>' + (msg.usuario_email || 'Usuário') + '</strong>: ' + msg.texto + ' <span class="time">' + new Date(msg.created_at).toLocaleTimeString() + '</span>';
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        })
        .subscribe();
    var btnEnviar = document.getElementById('btn-chat-grupo-enviar');
    var input = document.getElementById('chat-grupo-input');
    var novoBtn = btnEnviar.cloneNode(true);
    btnEnviar.parentNode.replaceChild(novoBtn, btnEnviar);
    var novoInput = input.cloneNode(true);
    input.parentNode.replaceChild(novoInput, input);
    novoBtn.onclick = async function() {
        var texto = novoInput.value.trim();
        if (!texto || !grupoAtual || !usuarioAtual) return;
        try {
            var { error } = await supabaseClient.from('mensagens_grupo').insert({
                grupo_id: grupoAtual.id,
                usuario_id: usuarioAtual.id,
                usuario_email: usuarioNomeExibicao || usuarioAtual.email.split('@')[0],
                texto: texto,
                created_at: new Date().toISOString()
            });
            if (error) throw error;
            novoInput.value = '';
        } catch (e) {
            console.error('Erro ao enviar mensagem:', e);
            alert('Erro ao enviar mensagem.');
        }
    };
    novoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') novoBtn.click();
    });
}

// ================================================================
//  AULAS
// ================================================================
async function carregarAulas() {
    try {
        var { data, error } = await supabaseClient
            .from('aulas')
            .select('*')
            .order('categoria', { ascending: true });
        if (error) throw error;
        var container = document.getElementById('aulas-lista');
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#94A3B8;"><i class="fas fa-video-slash"></i> Nenhuma aula adicionada ainda.</p>';
            return;
        }
        var html = '';
        data.forEach(function(aula) {
            var thumb = aula.link.includes('watch?v=') 
                ? 'https://img.youtube.com/vi/' + aula.link.split('v=')[1].split('&')[0] + '/mqdefault.jpg'
                : '';
            html += '<div class="aula-item"><div class="thumb">' + (thumb ? '<img src="' + thumb + '" alt="Thumb" />' : '<i class="fas fa-video"></i>') + '</div><div class="info"><div class="titulo"><i class="fas fa-play-circle"></i> ' + aula.titulo + '</div><div class="categoria"><i class="fas fa-folder"></i> ' + aula.categoria + '</div><a href="' + aula.link + '" target="_blank" class="link"><i class="fas fa-external-link-alt"></i> Assistir no YouTube</a></div></div>';
        });
        container.innerHTML = html;
    } catch (e) { console.error('Erro ao carregar aulas:', e); }
}

document.getElementById('btn-add-aula').addEventListener('click', async function() {
    var categoria = document.getElementById('aula-categoria').value.trim();
    var titulo = document.getElementById('aula-titulo').value.trim();
    var link = document.getElementById('aula-link').value.trim();
    if (!categoria || !titulo || !link) { alert('Preencha todos os campos.'); return; }
    try {
        await supabaseClient.from('aulas').insert({ categoria: categoria, titulo: titulo, link: link });
        alert('✅ Aula adicionada!');
        document.getElementById('aula-categoria').value = '';
        document.getElementById('aula-titulo').value = '';
        document.getElementById('aula-link').value = '';
        carregarAulas();
    } catch (e) {
        alert('Erro ao adicionar aula.');
        console.error(e);
    }
});

// ================================================================
//  FLASHCARDS
// ================================================================
async function carregarFlashcards() {
    if (!usuarioAtual) return;
    try {
        var { data, error } = await supabaseClient
            .from('flashcards')
            .select('*')
            .eq('usuario_id', usuarioAtual.id)
            .lte('proxima_revisao', hoje());
        if (error) throw error;
        var div = document.getElementById('flashcards-lista');
        if (!data || data.length === 0) {
            div.innerHTML = '<p style="color:#94A3B8;"><i class="fas fa-check-circle" style="color:#4ADE80;"></i> Nenhum flashcard para revisar hoje!</p>';
            return;
        }
        var html = '';
        data.forEach(function(f) {
            html += '<div class="flashcard-item" onclick="this.classList.toggle(\'aberto\')"><div class="pergunta"><i class="fas fa-key"></i> ' + f.pergunta + '</div><div class="resposta">' + f.resposta + '</div><button style="margin-top:10px; padding:4px 12px; font-size:12px; background:#2D3448; border:none; border-radius:8px; color:white; cursor:pointer;" onclick="event.stopPropagation(); revisarFlashcard(\'' + f.id + '\')"><i class="fas fa-check"></i> Já revisei</button></div>';
        });
        div.innerHTML = html;
    } catch (e) { console.error('Erro ao carregar flashcards:', e); }
}

async function revisarFlashcard(id) {
    try {
        var novaData = new Date();
        novaData.setDate(novaData.getDate() + 3);
        await supabaseClient
            .from('flashcards')
            .update({ proxima_revisao: novaData.toISOString().split('T')[0] })
            .eq('id', id);
        carregarFlashcards();
        alert('✅ Revisado! Próxima revisão em 3 dias.');
    } catch (e) { console.error('Erro ao revisar:', e); }
}

// ================================================================
//  RELATÓRIOS
// ================================================================
async function carregarRelatorios() {
    if (!usuarioAtual) return;
    try {
        var { data: sessoes, error } = await supabaseClient
            .from('sessoes')
            .select('duracao')
            .eq('usuario_id', usuarioAtual.id);
        if (error) throw error;
        var totalMin = sessoes.reduce(function(acc, s) { return acc + (s.duracao || 0); }, 0);
        document.getElementById('rel-total').textContent = totalMin;
        document.getElementById('rel-sessoes').textContent = sessoes.length;
        var { data: flashcards } = await supabaseClient
            .from('flashcards')
            .select('id')
            .eq('usuario_id', usuarioAtual.id);
        document.getElementById('rel-flashcards').textContent = flashcards ? flashcards.length : 0;
        document.getElementById('rel-racha').textContent = '0';
    } catch (e) { console.error('Erro ao carregar relatórios:', e); }
}

function carregarRanking() {}
