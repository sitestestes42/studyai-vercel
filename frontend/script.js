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
        if (!error && data) {
            usuarioNomeExibicao = data.nome_exibicao || user.email.split('@')[0];
            usuarioIdioma = data.idioma || 'pt';
        } else {
            usuarioNomeExibicao = user.email.split('@')[0];
            usuarioIdioma = 'pt';
        }
    } catch (e) {
        usuarioNomeExibicao = user.email.split('@')[0];
        usuarioIdioma = 'pt';
    }

    saudacaoTopo.innerHTML = 'Olá, <strong>' + usuarioNomeExibicao + '</strong> <i class="fas fa-wave-square"></i>';
    drawerUsuario.textContent = usuarioNomeExibicao;
    window.usuarioNomeExibicao = usuarioNomeExibicao;
    window.usuarioIdioma = usuarioIdioma;

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
//  MODOS
// ================================================================
var modosInfo = {
    smart: {
        icone: 'fas fa-brain',
        nome: 'Smart',
        descricao: 'Responde de forma equilibrada, adaptando a profundidade conforme a pergunta.',
        prompt: 'Responda de forma equilibrada, adaptando a profundidade conforme a pergunta. Seja claro e objetivo.'
    },
    deeper: {
        icone: 'fas fa-microscope',
        nome: 'Think Deeper',
        descricao: 'Respostas mais longas, com análises aprofundadas e múltiplas perspectivas.',
        prompt: 'Responda com análises aprofundadas, múltiplas perspectivas e detalhamento completo. Explore o tema em profundidade.'
    },
    learn: {
        icone: 'fas fa-graduation-cap',
        nome: 'Estude e Aprenda',
        descricao: 'Respostas com perguntas interativas, analogias e exemplos práticos. Guie o aprendizado passo a passo.',
        prompt: 'Responda com perguntas interativas, analogias e exemplos práticos. Guie o aprendizado passo a passo.'
    },
    search: {
        icone: 'fas fa-globe',
        nome: 'Pesquisar',
        descricao: 'Respostas com referências, citações e fontes confiáveis. Inclui a fonte ao final de cada informação.',
        prompt: 'Responda com referências, citações e fontes confiáveis. Inclua a fonte ao final de cada informação relevante.'
    }
};

function getModoPrompt(modo) {
    return modosInfo[modo] ? modosInfo[modo].prompt : modosInfo.smart.prompt;
}

// ================================================================
//  CONFIGURAÇÕES
// ================================================================
async function carregarConfiguracoes() {
    var selectIdioma = document.getElementById('config-idioma');
    if (selectIdioma) {
        selectIdioma.value = usuarioIdioma;
        selectIdioma.addEventListener('change', function() {
            usuarioIdioma = this.value;
            salvarConfiguracao('idioma', usuarioIdioma);
            document.getElementById('idioma-label').textContent = usuarioIdioma.toUpperCase();
        });
    }

    document.getElementById('btn-editar-nome').addEventListener('click', criarModalNome);
    document.getElementById('btn-alterar-senha').addEventListener('click', function() {
        alert('Funcionalidade em desenvolvimento. Em breve você poderá alterar sua senha.');
    });
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
//  SAUDAÇÃO
// ================================================================
function mostrarSaudacaoIA() {
    var chatMsg = document.getElementById('chat-mensagens');
    chatMsg.innerHTML = '';
    var saudacao = '✨ Olá! Como posso ajudar você hoje?';
    adicionarMensagemStreaming(saudacao, 'ia');
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
    chatInput.value = '';
    await salvarMensagem(conversaAtual.id, pergunta, 'usuario');

    var loading = mostrarDigitando();

    try {
        var modoPrompt = getModoPrompt(modoAtual);
        var idiomaNome = usuarioIdioma === 'pt' ? 'português' : usuarioIdioma === 'en' ? 'inglês' : 'espanhol';
        var systemPrompt = 'Você é o SiriusLearn. ' + modoPrompt + ' Responda SEMPRE em ' + idiomaNome + '.';
        var promptCompleto = systemPrompt + ' Pergunta: ' + pergunta;
        var resp = await chamarGroq(promptCompleto);
        removerDigitando(loading);

        var fontes = [];
        if (modoAtual === 'search') {
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
//  SELECIONAR MODO (ESTILO DEEPSEEK)
// ================================================================
document.querySelectorAll('.mode-item').forEach(function(item) {
    item.addEventListener('click', function() {
        document.querySelectorAll('.mode-item').forEach(function(m) {
            m.classList.remove('active');
        });
        this.classList.add('active');
        modoAtual = this.dataset.mode;
    });
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
    var conv = conversas.find(function(c) { return c.id === id; });
    if (!conv) return;
    conversaAtual = conv;
    renderizarListaConversas();
    carregarMensagensConversa(id);
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
//  GRUPOS, FLASHCARDS, RELATÓRIOS, AULAS (mantidos do código anterior)
// ================================================================
// (As funções de grupos, flashcards, relatórios e aulas permanecem as mesmas do código anterior)
// Para não estender demais, mantenha as funções que já estavam funcionando.
