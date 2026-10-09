/* =====================================================================
   ARTE MILITAR 011 — ILUSTRAÇÕES E ÍCONES
   ---------------------------------------------------------------------
   Desenhos vetoriais (SVG) usados quando um produto ainda não tem foto.
   Carregam instantaneamente, nunca "quebram" e mudam de cor conforme a
   variação escolhida pelo cliente.

   Você NÃO precisa editar este arquivo. Para usar fotos reais, preencha
   o campo "imagens" do produto em produtos.js.

   Tipos disponíveis (campo ilustracao.tipo do produto):
   coturno, bota, meia, gandola, camiseta, jaqueta, calca, bone, chapeu,
   balaclava, colete, cinto, coldre, modular, luva, joelheira, mochila,
   bornal, pochete, saco, faca, canivete, lanterna, headlamp, cantil,
   hidratacao, rede, poncho, bussola, binoculo, kit, marmita, patch,
   tarjeta, dogtag, oculos, abafador, caneca
   ===================================================================== */

(function () {
  "use strict";

  var CONTORNO = "#0c0e0a";
  var METAL = "#9aa0a4";
  var FERRAGEM = "#2a2d29";
  var seq = 0;

  /* ---------- cores ---------- */
  function hexParaRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function ajustar(hex, pct) {
    var rgb = hexParaRgb(hex);
    var alvo = pct < 0 ? 0 : 255;
    var f = Math.abs(pct);
    return (
      "#" +
      rgb
        .map(function (v) {
          var r = Math.round(v + (alvo - v) * f);
          return ("0" + r.toString(16)).slice(-2);
        })
        .join("")
    );
  }

  var CAMUFLAGENS = {
    "camo-multicam": { base: "#a6966c", manchas: ["#6f6a43", "#4e4630", "#c8b88a", "#7b5e3d"] },
    "camo-verde": { base: "#5d6b3c", manchas: ["#3a4426", "#262619", "#86784b", "#4b5a30"] },
    "camo-urbano": { base: "#878a8c", manchas: ["#5a5d60", "#2e3032", "#c0c2c2", "#6f7275"] }
  };
  var MANCHAS = [
    "M5 10Q20 0 30 12Q38 24 22 28Q8 30 5 10Z",
    "M45 5Q62 2 70 14Q74 26 58 24Q44 22 45 5Z",
    "M10 45Q24 36 36 48Q44 62 28 66Q10 66 10 45Z",
    "M50 40Q66 34 76 46Q80 60 64 62Q48 60 50 40Z",
    "M30 70Q42 66 50 74Q52 80 40 80Q30 80 30 70Z",
    "M60 66Q72 64 78 72L80 80L62 80Z",
    "M28 30Q36 26 42 34Q44 42 34 42Q26 40 28 30Z",
    "M0 62Q6 56 14 62L12 74Q2 74 0 62Z"
  ];

  function padraoCamuflagem(id, camo, escurecer) {
    var base = escurecer ? ajustar(camo.base, -0.22) : camo.base;
    var s = '<pattern id="' + id + '" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(-18) scale(.9)">';
    s += '<rect width="80" height="80" fill="' + base + '"/>';
    MANCHAS.forEach(function (d, i) {
      var cor = camo.manchas[i % camo.manchas.length];
      s += '<path d="' + d + '" fill="' + (escurecer ? ajustar(cor, -0.22) : cor) + '"/>';
    });
    return s + "</pattern>";
  }

  /* Monta a "paleta" do desenho a partir do nome da cor */
  function paleta(nomeCor) {
    var cores = (window.LOJA && window.LOJA.cores) || {};
    var valor = cores[nomeCor] || nomeCor || "#556b2f";
    var id = "il" + ++seq;
    if (CAMUFLAGENS[valor]) {
      var camo = CAMUFLAGENS[valor];
      return {
        id: id,
        c: "url(#" + id + "a)",
        d: "url(#" + id + "b)",
        l: ajustar(camo.base, 0.25),
        dd: ajustar(camo.base, -0.45),
        base: camo.base,
        defs: padraoCamuflagem(id + "a", camo, false) + padraoCamuflagem(id + "b", camo, true)
      };
    }
    if (!/^#/.test(valor)) valor = "#556b2f";
    return {
      id: id,
      c: valor,
      d: ajustar(valor, -0.25),
      dd: ajustar(valor, -0.5),
      l: ajustar(valor, 0.22),
      base: valor,
      defs: ""
    };
  }

  function costura(d, cor) {
    return '<path d="' + d + '" fill="none" stroke="' + (cor || "rgba(255,255,255,.28)") + '" stroke-width="1.4" stroke-dasharray="4 3"/>';
  }
  function molle(x, y, w, linhas, p) {
    var s = "";
    for (var i = 0; i < linhas; i++) {
      s += '<rect x="' + x + '" y="' + (y + i * 11) + '" width="' + w + '" height="6" rx="1" fill="' + p.dd + '" opacity=".55"/>';
      for (var k = x + 10; k < x + w - 4; k += 14) {
        s += '<rect x="' + k + '" y="' + (y + i * 11) + '" width="2" height="6" fill="' + p.base + '" opacity=".6"/>';
      }
    }
    return s;
  }
  var A = ' stroke="' + CONTORNO + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';

  /* ---------- desenhos (viewBox 0 0 200 200) ---------- */
  function calcado(p, cano, ziper) {
    var topo = 120 - cano;
    var s = "";
    s += '<path d="M24 152Q22 146 30 144L176 144Q182 144 182 151L182 156Q182 164 174 164L32 164Q24 164 24 156Z" fill="#141511"' + A + "/>";
    for (var x = 34; x < 176; x += 12) s += '<rect x="' + x + '" y="158" width="7" height="6" fill="#2b2c27"/>';
    s += '<path d="M38 144Q26 144 30 128Q34 114 60 108L90 100L94 ' + (topo + 10) + "Q94 " + topo + " 104 " + topo + "L152 " + topo + "Q162 " + topo + " 162 " + (topo + 10) + 'L166 144Z" fill="' + p.c + '"' + A + "/>";
    s += '<path d="M30 128Q34 114 60 108L72 105Q66 126 62 144L38 144Q26 144 30 128Z" fill="' + p.d + '"' + A + "/>";
    s += '<path d="M146 102L164 100L166 144L136 144Q142 120 146 102Z" fill="' + p.d + '"' + A + "/>";
    s += '<rect x="92" y="' + (topo - 6) + '" width="72" height="14" rx="6" fill="' + p.dd + '"' + A + "/>";
    s += costura("M36 138L160 138");
    if (ziper) {
      s += '<path d="M150 ' + (topo + 10) + 'L152 136" stroke="#c9c2a8" stroke-width="3"/><rect x="146" y="' + (topo + 12) + '" width="10" height="7" rx="2" fill="' + METAL + '"/>';
    }
    for (var y = topo + 14; y < 104; y += 12) {
      s += '<circle cx="98" cy="' + y + '" r="2.8" fill="' + METAL + '"/><circle cx="112" cy="' + (y + 2) + '" r="2.8" fill="' + METAL + '"/>';
      if (y + 12 < 104) s += '<path d="M98 ' + y + "L112 " + (y + 14) + "M112 " + (y + 2) + "L98 " + (y + 12) + '" stroke="' + p.dd + '" stroke-width="2.4"/>';
    }
    return s;
  }

  var DESENHOS = {
    coturno: function (p) { return calcado(p, 92, false); },
    bota: function (p) { return calcado(p, 70, true); },

    meia: function (p) {
      return (
        '<path d="M78 26L128 26L128 116Q128 128 140 134L166 148Q182 158 172 172Q164 182 148 176L94 160Q74 154 76 132Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M78 26L128 26L128 52L78 52Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M80 34L126 34M80 42L126 42" stroke="' + p.l + '" stroke-width="2"/>' +
        '<path d="M150 140L166 148Q182 158 172 172Q164 182 148 176L140 173Q150 158 150 140Z" fill="' + p.d + '"/>' +
        '<path d="M76 132Q74 154 94 160L106 164Q98 146 104 128Z" fill="' + p.d + '"/>'
      );
    },

    gandola: function (p) {
      return (
        '<path d="M68 38L100 48L132 38L162 52L188 132L166 142L150 96L150 174L50 174L50 96L34 142L12 132L38 52Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M68 38L100 48L88 70L74 52ZM132 38L100 48L112 70L126 52Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M100 48L100 174" stroke="' + p.dd + '" stroke-width="3"/>' +
        '<rect x="60" y="74" width="30" height="34" rx="3" fill="' + p.d + '"' + A + ' transform="rotate(-6 75 91)"/>' +
        '<rect x="110" y="74" width="30" height="34" rx="3" fill="' + p.d + '"' + A + ' transform="rotate(6 125 91)"/>' +
        '<rect x="150" y="70" width="18" height="14" rx="2" fill="' + p.dd + '" opacity=".8" transform="rotate(-16 159 77)"/>' +
        '<rect x="12" y="124" width="24" height="10" rx="2" fill="' + p.d + '" transform="rotate(23 24 129)"/>' +
        '<rect x="164" y="124" width="24" height="10" rx="2" fill="' + p.d + '" transform="rotate(-23 176 129)"/>' +
        costura("M54 168L146 168")
      );
    },

    camiseta: function (p) {
      return (
        '<path d="M68 36Q100 56 132 36L168 52L184 88L156 100L150 86L150 174L50 174L50 86L44 100L16 88L32 52Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M68 36Q100 56 132 36L128 34Q100 50 72 34Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M86 92L114 92L118 110L100 124L82 110Z" fill="' + p.l + '" opacity=".35"/>' +
        '<path d="M100 92L100 124M84 101L116 101" stroke="' + p.dd + '" stroke-width="2" opacity=".5"/>' +
        costura("M54 168L146 168") + costura("M22 84L44 94") + costura("M178 84L156 94")
      );
    },

    jaqueta: function (p) {
      return (
        '<path d="M64 46L100 54L136 46L164 60L186 138L164 146L150 100L150 176L50 176L50 100L36 146L14 138L36 60Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M66 48Q66 18 100 16Q134 18 134 48L118 60Q100 40 82 60Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M100 56L100 176" stroke="#c9c2a8" stroke-width="3"/><rect x="96" y="64" width="8" height="12" rx="2" fill="' + METAL + '"/>' +
        '<path d="M64 98L86 92M136 98L114 92" stroke="' + p.dd + '" stroke-width="3"/>' +
        '<path d="M58 140L90 140M142 140L110 140" stroke="' + p.dd + '" stroke-width="3"/>' +
        '<rect x="152" y="80" width="18" height="14" rx="2" fill="' + p.dd + '" opacity=".8" transform="rotate(-16 161 87)"/>' +
        '<rect x="50" y="166" width="100" height="10" fill="' + p.d + '"' + A + "/>"
      );
    },

    calca: function (p) {
      return (
        '<path d="M58 26L142 26L148 176L110 176L100 78L90 176L52 176Z" fill="' + p.c + '"' + A + "/>" +
        '<rect x="56" y="24" width="88" height="14" fill="' + p.d + '"' + A + "/>" +
        '<path d="M70 24L70 38M100 24L100 38M130 24L130 38" stroke="' + p.dd + '" stroke-width="4"/>' +
        '<rect x="52" y="86" width="26" height="34" rx="3" fill="' + p.d + '"' + A + "/>" +
        '<rect x="122" y="86" width="26" height="34" rx="3" fill="' + p.d + '"' + A + "/>" +
        '<path d="M52 86L78 86L78 96L52 96ZM122 86L148 86L148 96L122 96Z" fill="' + p.dd + '"/>' +
        '<path d="M60 128Q74 136 88 128L86 146Q74 150 60 146ZM112 128Q126 136 140 128L142 146Q126 150 114 146Z" fill="' + p.d + '" opacity=".9"/>' +
        '<path d="M100 38L100 78" stroke="' + p.dd + '" stroke-width="2"/>' +
        costura("M64 44Q76 60 92 44") + costura("M108 44Q124 60 136 44")
      );
    },

    bone: function (p) {
      return (
        '<path d="M40 122Q40 60 102 56Q160 60 160 122Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M40 120Q20 128 22 142Q60 156 112 140Q100 128 96 120Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M102 58Q84 80 80 122M102 58Q124 80 128 122" stroke="' + p.dd + '" stroke-width="2" fill="none"/>' +
        '<rect x="84" y="78" width="36" height="24" rx="3" fill="' + p.dd + '" opacity=".7"/>' +
        '<rect x="88" y="82" width="28" height="16" rx="2" fill="none" stroke="' + p.l + '" stroke-dasharray="3 2"/>' +
        '<circle cx="102" cy="56" r="5" fill="' + p.d + '"' + A + "/>" +
        costura("M42 116Q100 108 158 116")
      );
    },

    chapeu: function (p) {
      return (
        '<ellipse cx="100" cy="132" rx="86" ry="24" fill="' + p.d + '"' + A + "/>" +
        '<path d="M58 132Q54 70 100 68Q146 70 142 132Q100 144 58 132Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M58 112Q100 124 142 112L142 126Q100 138 58 126Z" fill="' + p.dd + '"/>' +
        '<path d="M74 114L74 126M100 118L100 132M126 114L126 126" stroke="' + p.base + '" stroke-width="5"/>' +
        '<circle cx="72" cy="90" r="2.5" fill="' + METAL + '"/><circle cx="128" cy="90" r="2.5" fill="' + METAL + '"/>' +
        costura("M30 134Q100 160 170 134")
      );
    },

    balaclava: function (p) {
      return (
        '<path d="M100 24Q152 24 154 90L160 176L40 176L46 90Q48 24 100 24Z" fill="' + p.c + '"' + A + "/>" +
        '<rect x="62" y="74" width="76" height="30" rx="14" fill="#b88c6a"' + A + "/>" +
        '<ellipse cx="84" cy="89" rx="7" ry="4.5" fill="#1d1712"/><ellipse cx="116" cy="89" rx="7" ry="4.5" fill="#1d1712"/>' +
        '<path d="M70 82Q84 76 96 82M104 82Q116 76 130 82" stroke="#5b3d2a" stroke-width="2.4" fill="none"/>' +
        '<path d="M46 150Q100 162 154 150" stroke="' + p.dd + '" stroke-width="3" fill="none"/>' +
        costura("M100 26L100 72")
      );
    },

    colete: function (p) {
      return (
        '<rect x="26" y="88" width="26" height="64" rx="6" fill="' + p.d + '"' + A + "/>" +
        '<rect x="148" y="88" width="26" height="64" rx="6" fill="' + p.d + '"' + A + "/>" +
        '<path d="M48 70Q48 58 60 58L74 58L80 26L100 26L98 58L102 58L100 26L120 26L126 58L140 58Q152 58 152 70L152 162Q152 172 142 172L58 172Q48 172 48 162Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M80 26L100 26L98 58L74 58ZM100 26L120 26L126 58L102 58Z" fill="' + p.d + '"' + A + "/>" +
        '<rect x="88" y="26" width="24" height="8" rx="3" fill="' + p.dd + '"/>' +
        molle(56, 66, 88, 3, p) +
        '<rect x="58" y="104" width="25" height="60" rx="4" fill="' + p.d + '"' + A + "/>" +
        '<rect x="88" y="104" width="25" height="60" rx="4" fill="' + p.d + '"' + A + "/>" +
        '<rect x="118" y="104" width="25" height="60" rx="4" fill="' + p.d + '"' + A + "/>" +
        '<path d="M58 104L83 104L83 122L58 122ZM88 104L113 104L113 122L88 122ZM118 104L143 104L143 122L118 122Z" fill="' + p.dd + '" opacity=".8"/>' +
        '<rect x="66" y="98" width="9" height="8" rx="2" fill="#1a1b17"/><rect x="96" y="98" width="9" height="8" rx="2" fill="#1a1b17"/><rect x="126" y="98" width="9" height="8" rx="2" fill="#1a1b17"/>' +
        costura("M30 100L48 100M30 140L48 140") + costura("M152 100L170 100M152 140L170 140")
      );
    },

    cinto: function (p) {
      var s =
        '<path d="M8 92Q100 74 192 92L192 118Q100 100 8 118Z" fill="' + p.c + '"' + A + "/>" +
        costura("M12 98Q100 81 188 98") + costura("M12 112Q100 95 188 112") +
        '<rect x="76" y="74" width="48" height="48" rx="8" fill="' + FERRAGEM + '"' + A + "/>" +
        '<rect x="84" y="82" width="32" height="32" rx="5" fill="#4b4f52"/>' +
        '<rect x="92" y="90" width="16" height="16" rx="3" fill="' + METAL + '"/>' +
        '<path d="M70 82L70 114M130 82L130 114" stroke="' + p.dd + '" stroke-width="6"/>';
      for (var x = 22; x < 62; x += 13) s += '<rect x="' + x + '" y="94" width="3" height="16" fill="' + p.dd + '" opacity=".6"/>';
      for (var x2 = 142; x2 < 184; x2 += 13) s += '<rect x="' + x2 + '" y="94" width="3" height="16" fill="' + p.dd + '" opacity=".6"/>';
      return s;
    },

    coldre: function (p) {
      return (
        '<rect x="106" y="58" width="58" height="66" rx="8" fill="' + p.d + '"' + A + "/>" +
        '<path d="M80 62L72 22Q70 14 78 14L104 14Q112 14 112 22L112 62Z" fill="#2c2e30"' + A + "/>" +
        '<path d="M78 24L106 24M78 32L106 32M80 40L108 40M82 48L108 48" stroke="#45484b" stroke-width="2"/>' +
        '<path d="M64 62L150 62Q160 62 158 72L134 168Q132 178 120 178L98 178Q88 178 89 168L94 98L70 94Q58 92 58 80L58 70Q58 62 64 62Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M64 62L150 62L148 76L62 76Z" fill="' + p.dd + '" opacity=".6"/>' +
        '<circle cx="118" cy="100" r="9" fill="' + p.dd + '"' + A + "/>" +
        '<circle cx="118" cy="100" r="3.5" fill="' + p.l + '"/>' +
        '<path d="M98 120L132 120" stroke="' + p.dd + '" stroke-width="2" opacity=".6"/>'
      );
    },

    modular: function (p) {
      function bolso(x) {
        return (
          '<rect x="' + x + '" y="62" width="46" height="108" rx="8" fill="' + p.c + '"' + A + "/>" +
          '<path d="M' + x + " 70Q" + x + " 54 " + (x + 8) + " 54L" + (x + 38) + " 54Q" + (x + 46) + " 54 " + (x + 46) + " 70L" + (x + 46) + " 96L" + x + ' 96Z" fill="' + p.d + '"' + A + "/>" +
          '<rect x="' + (x + 15) + '" y="94" width="16" height="10" rx="3" fill="#1b1c18"/>' +
          '<path d="M' + (x + 23) + " 54L" + (x + 23) + ' 40" stroke="#1b1c18" stroke-width="5"/>' +
          '<rect x="' + (x + 6) + '" y="120" width="34" height="6" fill="' + p.dd + '" opacity=".6"/>' +
          '<rect x="' + (x + 6) + '" y="134" width="34" height="6" fill="' + p.dd + '" opacity=".6"/>' +
          costura("M" + (x + 4) + " 164L" + (x + 42) + " 164")
        );
      }
      return bolso(50) + bolso(104);
    },

    luva: function (p) {
      return (
        '<rect x="56" y="150" width="88" height="30" rx="6" fill="' + p.d + '"' + A + "/>" +
        '<path d="M58 152L58 92Q58 80 70 80L134 80Q146 80 146 92L146 152Z" fill="' + p.c + '"' + A + "/>" +
        '<rect x="60" y="34" width="20" height="62" rx="10" fill="' + p.c + '"' + A + "/>" +
        '<rect x="82" y="22" width="20" height="74" rx="10" fill="' + p.c + '"' + A + "/>" +
        '<rect x="104" y="26" width="20" height="70" rx="10" fill="' + p.c + '"' + A + "/>" +
        '<rect x="126" y="42" width="18" height="56" rx="9" fill="' + p.c + '"' + A + "/>" +
        '<path d="M58 112Q36 104 28 82Q24 70 34 66Q44 64 50 76L60 96" fill="' + p.c + '"' + A + "/>" +
        '<path d="M62 90L142 90L140 106L64 106Z" fill="' + p.dd + '"' + A + "/>" +
        '<path d="M70 98L82 98M92 98L104 98M114 98L126 98" stroke="' + p.l + '" stroke-width="2"/>' +
        '<rect x="62" y="40" width="16" height="12" rx="4" fill="' + p.d + '"/><rect x="84" y="28" width="16" height="12" rx="4" fill="' + p.d + '"/>' +
        '<rect x="106" y="32" width="16" height="12" rx="4" fill="' + p.d + '"/><rect x="128" y="48" width="14" height="10" rx="4" fill="' + p.d + '"/>' +
        '<rect x="96" y="154" width="40" height="22" rx="4" fill="' + p.dd + '"/>'
      );
    },

    joelheira: function (p) {
      return (
        '<rect x="18" y="66" width="164" height="18" rx="6" fill="#1d1e1a"' + A + "/>" +
        '<rect x="18" y="122" width="164" height="18" rx="6" fill="#1d1e1a"' + A + "/>" +
        '<path d="M58 38Q100 18 142 38L152 150Q100 178 48 150Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M70 52Q100 38 130 52L136 132Q100 152 64 132Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M80 62Q100 54 120 62" stroke="' + p.l + '" stroke-width="3" fill="none" opacity=".6"/>' +
        '<rect x="22" y="70" width="14" height="10" rx="2" fill="' + METAL + '"/><rect x="164" y="126" width="14" height="10" rx="2" fill="' + METAL + '"/>'
      );
    },

    mochila: function (p) {
      return (
        '<path d="M60 52Q50 20 100 18Q150 20 140 52" fill="none" stroke="#1d1e1a" stroke-width="7"/>' +
        '<rect x="34" y="62" width="18" height="96" rx="8" fill="' + p.dd + '"' + A + "/>" +
        '<rect x="148" y="62" width="18" height="96" rx="8" fill="' + p.dd + '"' + A + "/>" +
        '<rect x="46" y="40" width="108" height="140" rx="24" fill="' + p.c + '"' + A + "/>" +
        '<path d="M46 74Q46 40 80 40L120 40Q154 40 154 74L154 86Q100 96 46 86Z" fill="' + p.d + '"' + A + "/>" +
        '<rect x="64" y="104" width="72" height="64" rx="10" fill="' + p.d + '"' + A + "/>" +
        molle(70, 130, 60, 3, p) +
        '<rect x="84" y="108" width="32" height="18" rx="2" fill="' + p.dd + '" opacity=".8"/>' +
        '<path d="M46 98L64 98M136 98L154 98M46 150L64 150M136 150L154 150" stroke="#1d1e1a" stroke-width="5"/>' +
        '<rect x="58" y="94" width="8" height="9" rx="2" fill="' + FERRAGEM + '"/><rect x="134" y="94" width="8" height="9" rx="2" fill="' + FERRAGEM + '"/>' +
        '<path d="M94 86L94 98M106 86L106 98" stroke="#1d1e1a" stroke-width="3"/>'
      );
    },

    bornal: function (p) {
      return (
        '<path d="M48 90Q48 6 100 6Q152 6 152 90" fill="none" stroke="' + p.dd + '" stroke-width="10"/>' +
        '<rect x="80" y="18" width="40" height="14" rx="5" fill="#1d1e1a"/>' +
        '<rect x="36" y="82" width="128" height="92" rx="12" fill="' + p.c + '"' + A + "/>" +
        '<path d="M36 94Q36 82 48 82L152 82Q164 82 164 94L164 132Q164 142 152 142L48 142Q36 142 36 132Z" fill="' + p.d + '"' + A + "/>" +
        molle(52, 96, 96, 3, p) +
        '<rect x="70" y="138" width="14" height="22" rx="3" fill="' + FERRAGEM + '"/><rect x="116" y="138" width="14" height="22" rx="3" fill="' + FERRAGEM + '"/>' +
        costura("M42 166L158 166")
      );
    },

    pochete: function (p) {
      return (
        '<path d="M6 100Q100 84 194 100L194 116Q100 100 6 116Z" fill="#1d1e1a"' + A + "/>" +
        '<path d="M44 84Q100 62 156 84L164 140Q100 166 36 140Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M46 98Q100 80 154 98" stroke="#c9c2a8" stroke-width="2.6" fill="none"/>' +
        '<rect x="128" y="86" width="8" height="14" rx="2" fill="' + METAL + '"/>' +
        '<path d="M58 112Q100 100 142 112L144 138Q100 152 56 138Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M64 120L136 120M64 130L136 130" stroke="' + p.dd + '" stroke-width="4" opacity=".6"/>' +
        '<rect x="88" y="98" width="24" height="16" rx="3" fill="' + FERRAGEM + '"/>'
      );
    },

    saco: function (p) {
      return (
        '<path d="M66 40L134 40L136 58L64 58Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M60 34Q100 26 140 34L140 46Q100 38 60 46Z" fill="' + p.dd + '"' + A + "/>" +
        '<rect x="88" y="22" width="24" height="16" rx="4" fill="#1b1c18"/>' +
        '<rect x="64" y="56" width="72" height="124" rx="18" fill="' + p.c + '"' + A + "/>" +
        '<path d="M74 64L74 170" stroke="' + p.l + '" stroke-width="6" opacity=".25" stroke-linecap="round"/>' +
        '<path d="M136 70Q168 110 136 160" stroke="#1b1c18" stroke-width="6" fill="none"/>' +
        '<rect x="84" y="104" width="32" height="30" rx="4" fill="none" stroke="' + p.l + '" stroke-width="2" opacity=".6"/>'
      );
    },

    faca: function (p) {
      return (
        '<g transform="rotate(-32 100 100)">' +
        '<path d="M98 88L170 90Q188 92 190 100Q176 110 150 110L98 110Z" fill="#4b5054"' + A + "/>" +
        '<path d="M100 104L150 104Q172 104 186 100" stroke="#c7ccd0" stroke-width="3" fill="none"/>' +
        '<path d="M106 94L150 94" stroke="#6a7075" stroke-width="2"/>' +
        '<rect x="88" y="78" width="12" height="42" rx="3" fill="' + FERRAGEM + '"' + A + "/>" +
        '<path d="M14 92Q14 86 22 86L88 88L88 112L22 114Q14 114 14 108Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M30 88L30 112M44 88L44 112M58 88L58 112M72 88L72 112" stroke="' + p.dd + '" stroke-width="4"/>' +
        '<circle cx="20" cy="100" r="3" fill="' + METAL + '"/>' +
        "</g>"
      );
    },

    canivete: function (p) {
      return (
        '<g transform="rotate(-18 100 110)">' +
        '<path d="M60 96L22 62Q16 56 24 54L30 54Q60 70 74 96Z" fill="#b9bec2"' + A + "/>" +
        '<path d="M30 58Q56 72 68 92" stroke="#e1e4e6" stroke-width="2" fill="none"/>' +
        '<rect x="40" y="92" width="130" height="36" rx="18" fill="' + p.c + '"' + A + "/>" +
        '<rect x="52" y="100" width="106" height="20" rx="10" fill="' + p.d + '"/>' +
        '<circle cx="58" cy="110" r="5" fill="' + METAL + '"/><circle cx="152" cy="110" r="5" fill="' + METAL + '"/>' +
        '<path d="M168 104L188 96L190 102L170 112Z" fill="#b9bec2"' + A + "/>" +
        "</g>"
      );
    },

    lanterna: function (p) {
      return (
        "<defs>" +
        '<linearGradient id="' + p.id + 'f" x1="0" x2="1"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".85"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></linearGradient>' +
        "</defs>" +
        '<g transform="rotate(-24 100 100)">' +
        '<path d="M156 84L240 40L240 160L156 116Z" fill="url(#' + p.id + 'f)"/>' +
        '<rect x="22" y="88" width="20" height="24" rx="5" fill="' + p.dd + '"' + A + "/>" +
        '<rect x="38" y="86" width="86" height="28" rx="4" fill="' + p.c + '"' + A + "/>" +
        '<path d="M50 88L50 112M58 88L58 112M66 88L66 112M74 88L74 112M82 88L82 112M90 88L90 112" stroke="' + p.dd + '" stroke-width="2.5"/>' +
        '<rect x="98" y="92" width="12" height="16" rx="3" fill="#7b1f1b"/>' +
        '<path d="M122 86L138 76L158 76L158 124L138 124L122 114Z" fill="' + p.d + '"' + A + "/>" +
        '<rect x="154" y="74" width="8" height="52" rx="2" fill="' + METAL + '"' + A + "/>" +
        '<ellipse cx="160" cy="100" rx="4" ry="22" fill="#fff7d6"/>' +
        "</g>"
      );
    },

    headlamp: function (p) {
      return (
        '<ellipse cx="100" cy="104" rx="78" ry="46" fill="none" stroke="' + p.c + '" stroke-width="14"/>' +
        '<ellipse cx="100" cy="104" rx="78" ry="46" fill="none" stroke="' + p.dd + '" stroke-width="2" stroke-dasharray="5 4"/>' +
        '<rect x="70" y="118" width="60" height="44" rx="12" fill="#232521"' + A + "/>" +
        '<circle cx="92" cy="140" r="13" fill="#fff4c9"' + A + "/>" +
        '<circle cx="118" cy="140" r="6" fill="#d33a2c"' + A + "/>" +
        '<rect x="80" y="112" width="40" height="8" rx="3" fill="' + METAL + '"/>'
      );
    },

    cantil: function (p) {
      return (
        '<path d="M70 52L130 52L130 62L70 62Z" fill="#1b1c18"' + A + "/>" +
        '<rect x="84" y="28" width="32" height="26" rx="6" fill="#1b1c18"' + A + "/>" +
        '<path d="M100 32Q60 26 52 50" stroke="#1b1c18" stroke-width="4" fill="none"/>' +
        '<path d="M50 74Q50 58 66 58L134 58Q150 58 150 74L150 164Q150 180 134 180L66 180Q50 180 50 164Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M50 74Q50 58 66 58L134 58Q150 58 150 74L150 96L50 96Z" fill="' + p.d + '"' + A + "/>" +
        '<rect x="68" y="88" width="18" height="16" rx="4" fill="' + FERRAGEM + '"/><rect x="114" y="88" width="18" height="16" rx="4" fill="' + FERRAGEM + '"/>' +
        '<circle cx="77" cy="96" r="3" fill="' + METAL + '"/><circle cx="123" cy="96" r="3" fill="' + METAL + '"/>' +
        costura("M58 172L142 172") + costura("M58 110L142 110")
      );
    },

    hidratacao: function (p) {
      return (
        '<path d="M120 48Q178 40 172 104Q168 150 132 150" stroke="#1b1c18" stroke-width="7" fill="none"/>' +
        '<rect x="122" y="140" width="18" height="22" rx="6" fill="#2f6b8f"' + A + "/>" +
        '<path d="M44 36Q44 26 56 26L116 26Q128 26 128 36L132 166Q132 180 118 180L54 180Q40 180 40 166Z" fill="' + p.c + '"' + A + "/>" +
        '<rect x="70" y="16" width="32" height="16" rx="5" fill="#1b1c18"' + A + "/>" +
        molle(54, 96, 64, 5, p) +
        costura("M48 170L124 170")
      );
    },

    rede: function (p) {
      return (
        '<rect x="6" y="20" width="16" height="170" rx="6" fill="#3b2e22"/><rect x="178" y="20" width="16" height="170" rx="6" fill="#3b2e22"/>' +
        '<path d="M22 56L50 96M178 56L150 96" stroke="#c9c2a8" stroke-width="3"/>' +
        '<path d="M50 70Q100 112 150 70" stroke="#d9d4c3" stroke-width="2" fill="none" stroke-dasharray="3 3" opacity=".7"/>' +
        '<path d="M44 60Q100 20 156 60L150 96Q100 70 50 96Z" fill="#d9d4c3" opacity=".14"/>' +
        '<path d="M50 94Q100 168 150 94L152 108Q100 184 48 108Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M60 106Q100 160 140 106" stroke="' + p.dd + '" stroke-width="2" fill="none" opacity=".7"/>'
      );
    },

    poncho: function (p) {
      var s =
        '<path d="M100 30Q120 30 122 54L178 150Q100 176 22 150L78 54Q80 30 100 30Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M80 50Q80 22 100 20Q120 22 120 50Q100 62 80 50Z" fill="' + p.d + '"' + A + "/>" +
        '<path d="M100 60L100 120" stroke="' + p.dd + '" stroke-width="2.4"/>';
      [[30, 146], [64, 158], [100, 162], [136, 158], [170, 146]].forEach(function (pt) {
        s += '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="3.5" fill="' + METAL + '"' + A.replace("2.6", "1.4") + "/>";
      });
      return s;
    },

    bussola: function (p) {
      var s =
        '<rect x="72" y="18" width="56" height="40" rx="8" fill="' + p.d + '"' + A + "/>" +
        '<rect x="96" y="22" width="8" height="30" rx="2" fill="#1b1c18"/>' +
        '<circle cx="100" cy="118" r="62" fill="' + p.c + '"' + A + "/>" +
        '<circle cx="100" cy="118" r="50" fill="#e9e2c9"' + A + "/>";
      for (var g = 0; g < 360; g += 10) {
        var r = g % 90 === 0 ? 38 : 43;
        var a = (g * Math.PI) / 180;
        s += '<line x1="' + (100 + Math.sin(a) * r).toFixed(1) + '" y1="' + (118 - Math.cos(a) * r).toFixed(1) + '" x2="' + (100 + Math.sin(a) * 48).toFixed(1) + '" y2="' + (118 - Math.cos(a) * 48).toFixed(1) + '" stroke="#2b2b25" stroke-width="' + (g % 90 === 0 ? 2.4 : 1.2) + '"/>';
      }
      s += '<text x="100" y="94" text-anchor="middle" font-family="Oswald,Arial,sans-serif" font-weight="700" font-size="14" fill="#9c2b22">N</text>';
      s += '<path d="M100 82L108 118L100 154L92 118Z" fill="#2b2b25"/><path d="M100 82L108 118L92 118Z" fill="#c0392b"/>';
      s += '<circle cx="100" cy="118" r="5" fill="' + METAL + '"' + A.replace("2.6", "1.4") + "/>";
      return s;
    },

    binoculo: function (p) {
      var gid = p.id + "lente";
      return (
        '<defs><radialGradient id="' + gid + '" cx=".35" cy=".35"><stop offset="0" stop-color="#7fb2d6"/><stop offset=".45" stop-color="#20384c"/><stop offset="1" stop-color="#0b1219"/></radialGradient></defs>' +
        '<rect x="84" y="62" width="32" height="56" rx="8" fill="' + p.dd + '"' + A + "/>" +
        '<rect x="92" y="48" width="16" height="18" rx="5" fill="' + FERRAGEM + '"' + A + "/>" +
        '<circle cx="58" cy="116" r="46" fill="' + p.c + '"' + A + "/>" +
        '<circle cx="142" cy="116" r="46" fill="' + p.c + '"' + A + "/>" +
        '<circle cx="58" cy="116" r="32" fill="' + p.dd + '"/><circle cx="142" cy="116" r="32" fill="' + p.dd + '"/>' +
        '<circle cx="58" cy="116" r="26" fill="url(#' + gid + ')"/><circle cx="142" cy="116" r="26" fill="url(#' + gid + ')"/>' +
        '<ellipse cx="48" cy="104" rx="7" ry="4" fill="#fff" opacity=".45" transform="rotate(-30 48 104)"/>' +
        '<ellipse cx="132" cy="104" rx="7" ry="4" fill="#fff" opacity=".45" transform="rotate(-30 132 104)"/>'
      );
    },

    kit: function (p) {
      return (
        '<rect x="30" y="58" width="140" height="96" rx="14" fill="' + p.c + '"' + A + "/>" +
        '<path d="M30 72Q30 58 44 58L156 58Q170 58 170 72L170 92L30 92Z" fill="' + p.d + '"' + A + "/>" +
        molle(44, 106, 112, 3, p) +
        '<rect x="88" y="86" width="24" height="12" rx="3" fill="' + FERRAGEM + '"/>' +
        '<circle cx="52" cy="160" r="20" fill="#7b2f2a"' + A + "/>" +
        '<path d="M40 160Q52 146 64 160Q52 174 40 160M46 160Q52 154 58 160" stroke="#b9554c" stroke-width="2" fill="none"/>' +
        '<rect x="80" y="150" width="56" height="12" rx="6" fill="#d9822b"' + A + ' transform="rotate(-8 108 156)"/>' +
        '<rect x="140" y="140" width="10" height="44" rx="4" fill="#3a3d40"' + A + ' transform="rotate(30 145 162)"/>'
      );
    },

    marmita: function (p) {
      return (
        '<path d="M36 72Q36 44 70 46Q100 50 116 58Q130 48 150 50Q170 54 170 80L168 138Q166 166 132 166L72 166Q36 166 36 138Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M36 90L170 90" stroke="' + p.dd + '" stroke-width="3"/>' +
        '<path d="M48 60Q80 56 112 66" stroke="#fff" stroke-width="5" opacity=".5" fill="none" stroke-linecap="round"/>' +
        '<path d="M170 100L196 92L198 100L172 112Z" fill="' + p.d + '"' + A + "/>" +
        '<rect x="56" y="112" width="96" height="30" rx="6" fill="none" stroke="' + p.dd + '" stroke-width="2" opacity=".5"/>'
      );
    },

    patch: function (p) {
      return (
        '<rect x="24" y="52" width="152" height="100" rx="12" fill="' + p.dd + '"' + A + "/>" +
        '<rect x="32" y="60" width="136" height="84" rx="8" fill="' + p.c + '"/>' +
        '<path d="M100 66L158 102L100 138L42 102Z" fill="' + p.l + '" opacity=".75"/>' +
        '<circle cx="100" cy="102" r="22" fill="' + p.dd + '"/>' +
        '<path d="M79 98Q100 90 121 104" stroke="' + p.l + '" stroke-width="4" fill="none"/>' +
        costura("M30 58L170 58L170 146L30 146Z", p.l)
      );
    },

    tarjeta: function (p) {
      return (
        '<rect x="14" y="76" width="172" height="48" rx="8" fill="' + p.dd + '"' + A + "/>" +
        '<rect x="20" y="82" width="160" height="36" rx="5" fill="' + p.c + '"/>' +
        '<text x="100" y="109" text-anchor="middle" font-family="\'Black Ops One\',Impact,sans-serif" font-size="19" letter-spacing="2" fill="#15160f">SEU NOME</text>' +
        costura("M18 80L182 80L182 120L18 120Z", p.l)
      );
    },

    dogtag: function (p) {
      var tag = function (x, y, rot) {
        return (
          '<g transform="rotate(' + rot + " " + (x + 34) + " " + (y + 48) + ')">' +
          '<path d="M' + (x + 14) + " " + y + "L" + (x + 54) + " " + y + "Q" + (x + 68) + " " + y + " " + (x + 68) + " " + (y + 14) + "L" + (x + 68) + " " + (y + 82) + "Q" + (x + 68) + " " + (y + 96) + " " + (x + 54) + " " + (y + 96) + "L" + (x + 14) + " " + (y + 96) + "Q" + x + " " + (y + 96) + " " + x + " " + (y + 82) + "L" + x + " " + (y + 14) + "Q" + x + " " + y + " " + (x + 14) + " " + y + 'Z" fill="' + p.c + '"' + A + "/>" +
          '<circle cx="' + (x + 34) + '" cy="' + (y + 12) + '" r="4.5" fill="#1b1c18"/>' +
          '<path d="M' + (x + 12) + " " + (y + 32) + "L" + (x + 56) + " " + (y + 32) + "M" + (x + 12) + " " + (y + 44) + "L" + (x + 50) + " " + (y + 44) + "M" + (x + 12) + " " + (y + 56) + "L" + (x + 56) + " " + (y + 56) + "M" + (x + 12) + " " + (y + 68) + "L" + (x + 44) + " " + (y + 68) + '" stroke="' + p.dd + '" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M' + (x + 8) + " " + (y + 8) + "L" + (x + 8) + " " + (y + 88) + '" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>' +
          "</g>"
        );
      };
      return (
        '<path d="M30 30Q100 -6 170 30Q190 70 132 78M30 30Q12 70 82 76" stroke="' + METAL + '" stroke-width="3" stroke-dasharray="2 3" fill="none"/>' +
        tag(58, 74, -14) + tag(84, 82, 10)
      );
    },

    oculos: function (p) {
      var gid = p.id + "o";
      return (
        '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b6c78"/><stop offset=".5" stop-color="#1b232a"/><stop offset="1" stop-color="#0c1014"/></linearGradient></defs>' +
        '<path d="M14 92L4 120M186 92L196 120" stroke="' + p.c + '" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M16 82Q100 64 184 82L180 104Q172 138 132 134Q112 132 104 116L96 116Q88 132 68 134Q28 138 20 104Z" fill="url(#' + gid + ')"' + A + "/>" +
        '<path d="M16 82Q100 64 184 82L184 90Q100 74 16 90Z" fill="' + p.c + '"' + A + "/>" +
        '<path d="M34 100Q48 92 66 96" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>' +
        '<path d="M120 98Q138 90 160 96" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>'
      );
    },

    abafador: function (p) {
      return (
        '<path d="M44 112Q40 30 100 28Q160 30 156 112" fill="none" stroke="' + p.c + '" stroke-width="14"/>' +
        '<rect x="84" y="20" width="32" height="14" rx="5" fill="#1b1c18"/>' +
        '<rect x="20" y="96" width="50" height="76" rx="22" fill="' + p.c + '"' + A + "/>" +
        '<rect x="130" y="96" width="50" height="76" rx="22" fill="' + p.c + '"' + A + "/>" +
        '<rect x="60" y="102" width="16" height="64" rx="8" fill="#1b1c18"/>' +
        '<rect x="124" y="102" width="16" height="64" rx="8" fill="#1b1c18"/>' +
        '<ellipse cx="45" cy="134" rx="12" ry="22" fill="' + p.d + '"/><ellipse cx="155" cy="134" rx="12" ry="22" fill="' + p.d + '"/>'
      );
    },

    caneca: function (p) {
      return (
        '<path d="M146 76Q186 76 184 112Q182 146 146 146" fill="none" stroke="' + p.c + '" stroke-width="13"/>' +
        '<path d="M146 76Q186 76 184 112Q182 146 146 146" fill="none" stroke="#e6e6e2" stroke-width="3"/>' +
        '<path d="M36 56L150 56L146 166Q146 178 132 178L54 178Q40 178 40 166Z" fill="' + p.c + '"' + A + "/>" +
        '<ellipse cx="93" cy="56" rx="57" ry="10" fill="#22241f"' + A + "/>" +
        '<path d="M36 56Q93 76 150 56" stroke="#e6e6e2" stroke-width="5" fill="none"/>' +
        '<path d="M40 166Q93 184 146 166" stroke="#e6e6e2" stroke-width="4" fill="none"/>' +
        '<text x="93" y="128" text-anchor="middle" font-family="\'Black Ops One\',Impact,sans-serif" font-size="24" fill="' + p.l + '" opacity=".85">AM 011</text>' +
        '<circle cx="128" cy="150" r="4" fill="#1b1c18" opacity=".7"/>'
      );
    }
  };
  /* Apelidos (tipos com o mesmo desenho) */
  DESENHOS.camisa = DESENHOS.gandola;

  /**
   * Gera o SVG de um produto.
   * @param {string} tipo  ex.: "coturno"
   * @param {string} cor   nome da cor (ex.: "Preto") ou código "#rrggbb"
   * @param {string} [rotulo] texto alternativo (acessibilidade)
   */
  function ilustracao(tipo, cor, rotulo) {
    var desenho = DESENHOS[tipo] || DESENHOS.mochila;
    var p = paleta(cor);
    var corpo = desenho(p);
    return (
      '<svg class="ilustracao" viewBox="0 0 200 200" role="img" aria-label="' + (rotulo || tipo).replace(/"/g, "&quot;") + '" xmlns="http://www.w3.org/2000/svg">' +
      (p.defs ? "<defs>" + p.defs + "</defs>" : "") +
      '<ellipse cx="100" cy="186" rx="72" ry="8" fill="#000" opacity=".35"/>' +
      corpo +
      "</svg>"
    );
  }

  /* ---------------- ÍCONES DA INTERFACE (traço, 24×24) ---------------- */
  var I = {
    inicio: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    pedido: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17" cy="20.5" r="1.3"/>',
    loja: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
    mapa: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    telefone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    whatsapp: '<path d="M4 20l1.3-3.9A8.5 8.5 0 1 1 8.2 19z"/><path d="M9 8.5c0 3.6 2.9 6.5 6.5 6.5l1-1.6-2-1-1 .8a4.5 4.5 0 0 1-2.2-2.2l.8-1-1-2z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3a5 5 0 0 0 5 5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
    seta: '<path d="M9 6l6 6-6 6"/>',
    voltar: '<path d="M15 6l-6 6 6 6"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    lixeira: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    caminhao: '<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    escudo: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    pix: '<path d="M12 3l4 4-4 4-4-4zM12 13l4 4-4 4-4-4zM3 12l4-4 4 4-4 4zM13 12l4-4 4 4-4 4z"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    estrela: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    fogo: '<path d="M12 21c-4 0-7-2.7-7-6.5 0-3.6 3-5.4 3.5-9.5 2 1.3 3.5 3.3 3.5 5.5C13 9 14 7.6 14.4 6c2.3 1.8 4.6 4.8 4.6 8.5 0 3.8-3 6.5-7 6.5z"/>',
    novo: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
    paleta: '<path d="M12 3a9 9 0 0 0 0 18c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.4-9-7.4z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
    compartilhar: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    lista: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    filtro: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    navegar: '<path d="M3 11l18-8-8 18-2-8z"/>',
    camisa: '<path d="M8 3l4 2 4-2 5 3-2 5-3-1v11H8V10l-3 1-2-5z"/>',
    coturno: '<path d="M8 3h7v10l5 2a2 2 0 0 1 1.5 2v2H3v-4l2-3h3z"/><path d="M8 7h4M8 10h4"/>',
    colete: '<path d="M8 3l1 4h6l1-4 4 3v15H4V6z"/><path d="M8 13h8M8 17h8"/>',
    mochila: '<rect x="5" y="6" width="14" height="15" rx="4"/><path d="M9 6V4h6v2M9 14h6v4H9z"/>',
    lanterna: '<path d="M9 9h6l-1 12h-4z"/><path d="M8 3h8v6H8z"/><path d="M12 13v2"/>',
    patch: '<path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z"/>'
  };

  function icone(nome, classe) {
    return (
      '<svg class="icone ' + (classe || "") + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      (I[nome] || I.info) +
      "</svg>"
    );
  }

  window.ILUSTRACOES = { ilustracao: ilustracao, icone: icone, tipos: Object.keys(DESENHOS), ajustar: ajustar };
})();
