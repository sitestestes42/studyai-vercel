const SUPABASE_URL = 'https://vpihrpqvzrmixxdrqwbj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ucBzmjp0Xbwi7Z-RHsk4Yg_LydKnMMZ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function hoje() { return new Date().toISOString().split('T')[0]; }
function formatarTempo(seg) {
    var m = String(Math.floor(seg / 60)).padStart(2, '0');
    var s = String(seg % 60).padStart(2, '0');
    return m + ':' + s;
}

var usuarioAtual = null;
var grupoAtual = null;
var chatGrupoSubscription = null;
var conversaAtual = null;
var conversas = [];
var usuarioNomeExibicao = '';
var usuarioIdioma = 'pt';
var modoAtual = 'smart';

function carregarIdioma() { return usuarioIdioma || 'pt'; }

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
    loginMsg.innerHTML = 'Crie sua conta e escolha seu idioma preferido.<br><br>' +
        '<label style="display:block; text-align:left; color:#94A3B8; font-size:13px; margin-bottom:4px;">Idioma</label>' +
        '<select id="idioma-cadastro" style="width:100%; padding:12px 16px; background:#0B0E14; border:1px solid #2D3448; border-radius:12px; color:#F1F5F9; font-size:15px; margin-bottom:12px;">' +
        '<option value="pt">🇧🇷 Português</option>' +
        '<option value="en">🇺🇸 English</option>' +
        '<option value="es">🇪🇸 Español</option>' +
        '</select>';
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
            var idiomaSelect = document.getElementById('idioma-cadastro');
            var idioma = idiomaSelect ? idiomaSelect.value : 'pt';
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
                    idioma: idioma
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

    saudacaoTopo.innerHTML = 'Olá, <strong>' + usuarioNomeExibicao + '</strong> 🌟';
    drawerUsuario.textContent = usuarioNomeExibicao;
    window.usuarioNomeExibicao = usuarioNomeExibicao;
    window.usuarioIdioma = usuarioIdioma;

    var adminEmail = 'ruasflavio29@gmail.com';
    if (user.email === adminEmail) {
        document.getElementById('admin-aulas').style.display = 'block';
    }

    adicionarBotaoEditarNome();

    carregarDadosUsuario();
    carregarConversas();
    carregarGrupoDoUsuario();
    carregarAulas();
}

function adicionarBotaoEditarNome() {
    var topBarRight = document.querySelector('.top-bar-right');
    var btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️ Nome';
    btnEditar.className = 'btn-sair';
    btnEditar.style.marginRight = '8px';
    btnEditar.addEventListener('click', criarModalNome);
    topBarRight.insertBefore(btnEditar, topBarRight.firstChild);
}

function criarModalNome() {
    var overlay = document.createElement('div');
    overlay.id = 'modal-nome';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);';
    overlay.innerHTML = '<div style="background:#1A1F2E; border-radius:20px; padding:32px; max-width:400px; width:90%; border:1px solid #2D3448; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);"><h3 style="margin-bottom:8px; color:#F1F5F9;">✏️ Editar Nome</h3><p style="color:#94A3B8; font-size:14px; margin-bottom:16px;">Como você quer ser chamado?</p><input type="text" id="input-novo-nome" placeholder="Digite seu novo nome" value="' + usuarioNomeExibicao + '" style="width:100%; padding:12px 16px; background:#0B0E14; border:1px solid #2D3448; border-radius:12px; color:#F1F5F9; font-size:16px; margin-bottom:16px;"><div style="display:flex; gap:10px;"><button onclick="salvarNomeUsuario()" style="flex:1; background:#7C3AED; color:white; border:none; padding:12px; border-radius:12px; font-weight:600; cursor:pointer;">💾 Salvar</button><button onclick="fecharModalNome()" style="flex:1; background:#2D3448; color:#94A3B8; border:none; padding:12px; border-radius:12px; font-weight:600; cursor:pointer;">Cancelar</button></div></div>';
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
        var { error } = await supabaseClient
            .from('usuarios')
            .upsert({ id: usuarioAtual.id, nome_exibicao: nome });
        if (error) throw error;

        usuarioNomeExibicao = nome;
        window.usuarioNomeExibicao = nome;
        saudacaoTopo.innerHTML = 'Olá, <strong>' + nome + '</strong> 🌟';
        drawerUsuario.textContent = nome;
        fecharModalNome();
        alert('✅ Nome atualizado com sucesso!');
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar nome.');
    }
};

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
    if (!texto) throw new Error('Resposta vazia');
    return texto;
}

function getModoPrompt(modo) {
    var modos = {
        smart: 'Responda de forma equilibrada, adaptando a profundidade conforme a pergunta. Seja claro e objetivo.',
        deeper: 'Responda com análises aprofundadas, múltiplas perspectivas e detalhamento completo. Explore o tema em profundidade.',
        learn: 'Responda com perguntas interativas, analogias e exemplos práticos. Guie o aprendizado passo a passo.',
        search: 'Responda com referências, citações e fontes confiáveis. Inclua a fonte ao final de cada informação relevante.'
    };
    return modos[modo] || modos.smart;
}

function mostrarSaudacaoIA() {
    var chatMsg = document.getElementById('chat-mensagens');
    chatMsg.innerHTML = '';
    var saudacao = '✨ Olá! Como posso ajudar você hoje?';
    adicionarMensagemStreaming(saudacao, 'ia');
}

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
        await new Promise(function(r) { setTimeout(r, 60); });
    }
    if (fontes && fontes.length) {
        var fontesHtml = '<div class="fontes"><strong>📚 Fontes:</strong><br>' + fontes.join('<br>') + '</div>';
        div.innerHTML += fontesHtml;
    }
}

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
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/^\|.*\|$/gm, function(match) {
        var rows = match.split('\n').filter(function(r) { return r.trim().startsWith('|'); });
        if (rows.length < 2) return match;
        var tableHtml = '<table>';
        rows.forEach(function(row, ri) {
            var cells = row.split('|').filter(function(c) { return c.trim() !== ''; });
            if (cells.every(function(c) { return /^-+$/.test(c.trim()); })) return;
            tableHtml += '<tr>';
            cells.forEach(function(cell) {
                var tag = ri === 0 ? 'th' : 'td';
                tableHtml += '<' + tag + '>' + cell.trim() + '</' + tag + '>';
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</table>';
        return tableHtml;
    });
    html = html.replace(/^> (.*)/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    if (!html.startsWith('<') && !html.startsWith('</')) {
        html = '<p>' + html + '</p>';
    }
    return html;
}

function adicionarMensagemLocal(texto, tipo) {
    var chatMsg = document.getElementById('chat-mensagens');
    var div = document.createElement('div');
    div.className = 'mensagem ' + tipo;
    div.textContent = texto;
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

function detectarComando(texto) {
    var lower = texto.toLowerCase().trim();
    if (lower.includes('pdf') || lower.includes('gerar pdf')) return 'pdf';
    if (lower.includes('resumo') || lower.includes('sumário')) return 'resumo';
    if (lower.includes('planilha') || lower.includes('csv')) return 'csv';
    if (lower.includes('upload') || lower.includes('enviar pdf') || lower.includes('anexar')) return 'upload';
    return null;
}

async function enviarPergunta(pergunta) {
    if (!pergunta.trim() || !conversaAtual) return;

    var comando = detectarComando(pergunta);
    if (comando) {
        if (comando === 'pdf') {
            gerarPDF();
            return;
        } else if (comando === 'resumo') {
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
        erroDiv.innerHTML = '❌ <em>Erro ao obter resposta. Tente novamente.</em>';
        erroDiv.style.borderLeftColor = '#F87171';
        document.getElementById('chat-mensagens').appendChild(erroDiv);
        console.error(e);
    }
    btnChat.disabled = false;
}

function gerarPDF() {
    var mensagens = document.querySelectorAll('#chat-mensagens .mensagem');
    var texto = '';
    mensagens.forEach(function(m) {
        var tipo = m.classList.contains('usuario') ? 'Você' : 'SiriusLearn';
        texto += tipo + ': ' + m.textContent.trim() + '\n\n';
    });
    var blob = new Blob([texto], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'conversa-siriuslearn.pdf';
    a.click();
    URL.revokeObjectURL(url);
}

function gerarResumo() {
    var mensagens = document.querySelectorAll('#chat-mensagens .mensagem');
    var texto = '';
    mensagens.forEach(function(m) {
        var tipo = m.classList.contains('usuario') ? 'Você' : 'SiriusLearn';
        texto += tipo + ': ' + m.textContent.trim() + '\n\n';
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
    var mensagens = document.querySelectorAll('#chat-mensagens .mensagem');
    var linhas = ['Tipo,Mensagem'];
    mensagens.forEach(function(m) {
        var tipo = m.classList.contains('usuario') ? 'Usuário' : 'IA';
        var texto = m.textContent.trim().replace(/,/g, ';');
        linhas.push(tipo + ',' + texto);
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

var chatInput = document.getElementById('chat-input');
var btnChat = document.getElementById('btn-chat-enviar');

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

document.querySelectorAll('.mode-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.mode-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        modoAtual = this.dataset.mode;
    });
});

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
    try {
        await supabaseClient
            .from('conversas')
            .delete()
            .eq('id', id)
            .eq('usuario_id', usuarioAtual.id);
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
    }
}

async function alternarConversa(id) {
    var conv = conversas.find(function(c) { return c.id === id; });
    if (!conv) return;
    conversaAtual = conv;
    renderizarListaConversas();
    carregarMensagensConversa(id);
}

function renderizarListaConversas() {
    var container = document.getElementById('lista-conversas');
    if (!container) return;
    if (conversas.length === 0) {
        container.innerHTML = '<p style="color:#475569; font-size:13px;">Nenhuma conversa</p>';
        return;
    }
    var html = '';
    conversas.forEach(function(c) {
        var active = conversaAtual && conversaAtual.id === c.id ? 'active' : '';
        html += '<div class="conversa-item ' + active + '" onclick="alternarConversa(\'' + c.id + '\')">';
        html += '<span>💬 ' + (c.titulo || 'Conversa') + '</span>';
        html += '<button class="btn-delete-conversa" onclick="event.stopPropagation(); deletarConversa(\'' + c.id + '\')">✕</button>';
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
    });
});

document.addEventListener('DOMContentLoaded', function() {
    carregarRanking();
    carregarFlashcards();
    carregarRelatorios();
});

// ====== GRUPOS, FLASHCARDS, RELATÓRIOS, AULAS (mantidos do código anterior) ======
// (Inclua aqui as funções de grupos, flashcards, relatórios, aulas, etc.
//  como já estavam no script anterior. Vou omitir para não estender demais,
//  mas você pode reaproveitar do código que já tinha.)
