/* ==========================================================================
   WORLD RENDERER MODULE (world_renderer.js)
   Renderiza en HTML5 Canvas el mundo 2D en loop y transición progresiva:
   Sabana Verde y Flora Nativa -> Transición Urbana -> Bogotá Industrial -> Nido
   ========================================================================== */

const WorldRenderer = (() => {
  let trees = [];
  let buildings = [];
  let clouds = [];
  let flora = [];

  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  function lerpColor(hex1, hex2, t) {
    t = Math.max(0, Math.min(1, t));
    const c1 = parseInt(hex1.slice(1), 16);
    const c2 = parseInt(hex2.slice(1), 16);
    const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t));
    const g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t));
    const b = Math.round(lerp(c1 & 255, c2 & 255, t));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function getUrbanFactor(worldX) {
    // 0.0 en naturaleza pura (X < 1750)
    // Sube de 0.0 a 1.0 entre X = 1750 y X = 3550 (llegando al Simulador en X=3680)
    // Baja de 1.0 a 0.0 entre X = 3950 y X = 4450 (regresando al Parque y al Nido Final)
    if (worldX < 1750) return 0;
    if (worldX < 3550) return (worldX - 1750) / 1800;
    if (worldX < 3950) return 1.0;
    if (worldX < 4500) return 1.0 - (worldX - 3950) / 550;
    return 0;
  }

  function initScenery() {
    trees = [];
    buildings = [];
    clouds = [];
    flora = [];

    // Nubes en loop
    for (let i = 0; i < 24; i++) {
      clouds.push({
        x: i * 260 + (i % 3) * 50,
        yRatio: 0.10 + (i % 4) * 0.06,
        scale: 0.75 + (i % 3) * 0.28,
        speed: 12 + (i % 3) * 6
      });
    }

    // Árboles nativos (abundantes en Zona Verde 0..2200 y Zona Parque/Nido 4150..5350)
    for (let x = 80; x < 5300; x += 95) {
      const u = getUrbanFactor(x);
      if (u < 0.65 || (x % 285 === 0)) {
        trees.push({
          x: x + ((x * 17) % 35),
          height: 85 + ((x * 13) % 65),
          crownRadius: 34 + ((x * 7) % 24),
          kind: (x % 2 === 0) ? 'aliso' : 'arrayan',
          hasFlowers: (x % 3 === 0)
        });
      }
    }

    // Flora de piso (arbustos, helechos, flores de la Sabana)
    for (let x = 40; x < 5350; x += 55) {
      if (getUrbanFactor(x) < 0.75) {
        flora.push({
          x: x,
          size: 10 + (x % 9),
          flowerColor: (x % 3 === 0) ? '#F59E0B' : (x % 2 === 0 ? '#EC4899' : '#FFFFFF')
        });
      }
    }

    // Edificios de Bogotá (Concentrados entre X = 1850 y X = 4200)
    for (let x = 1850; x <= 4200; x += 78) {
      const u = getUrbanFactor(x);
      const isHighrise = (x > 2700 && x < 3950 && x % 156 === 0);
      const isFactory = (x > 3250 && x < 4050 && x % 234 === 0);
      buildings.push({
        x: x,
        width: isFactory ? 84 : 58 + (x % 22),
        height: isHighrise ? 230 + (x % 70) : (95 + Math.round(u * 95) + (x % 45)),
        isBrick: (x % 2 === 0),
        isFactory: isFactory,
        isColpatria: (Math.abs(x - 3010) < 42)
      });
    }
  }

  function render(ctx, width, height, state, timeSec) {
    if (trees.length === 0) initScenery();

    const camX = state.cameraX;
    const centerWorldX = camX + width * 0.5;
    const urban = getUrbanFactor(centerWorldX);
    const groundY = height - 92;

    // 1. CIELO DINÁMICO (Verde/Blanco Natural -> Gris/Ámbar Urbano Bogotá -> Verde Nido)
    const skyTop = lerpColor('#B7E4C7', '#CBD5E1', urban);
    const skyMid = lerpColor('#F2FBF5', '#E2E8F0', urban);
    const skyBot = lerpColor('#D8F3DC', '#FED7AA', urban * 0.85);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(0.55, skyMid);
    skyGrad.addColorStop(1, skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);

    // Sol / Resplandor de la Sabana
    const sunX = width * 0.82;
    const sunY = height * 0.18;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 110);
    sunGrad.addColorStop(0, urban > 0.6 ? 'rgba(251, 146, 60, 0.55)' : 'rgba(255, 255, 240, 0.85)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
    ctx.fill();

    // 2. CERROS ORIENTALES EN PARALLAX LOOP (Con Santuario de Monserrate al fondo)
    drawMountainsParallax(ctx, width, groundY, camX, urban);

    // 3. NUBES EN LOOP CONTINUO
    drawLoopingClouds(ctx, width, height, camX, timeSec, urban);

    // 4. CAPA DE EDIFICIOS DE BOGOTÁ (Transición a Ciudad)
    drawUrbanSkyline(ctx, width, groundY, camX, timeSec);

    // 5. ÁRBOLES Y FLORA DE LA SABANA
    drawTreesAndFlora(ctx, width, groundY, camX, timeSec);

    // 6. SUELO (Pradera Verde -> Avenida Urbana -> Pradera del Nido)
    drawGround(ctx, width, height, groundY, camX, urban);

    // 7. OBSTÁCULOS AÉREOS (Remolinos, Vórtices LU, Nubes de Smog PM10)
    drawObstacles(ctx, width, height, camX, timeSec, state);

    // 8. LAS 8 PARADAS INTERACTIVAS (Amigos, Estructuras, Simulador y Nido)
    drawWorldStops(ctx, width, groundY, camX, state, timeSec);

    // 9. RUFINO EL COPETÓN BOGOTANO
    drawCopeton(ctx, state.bird.x - camX, state.bird.y, state.bird, timeSec);
  }

  function drawMountainsParallax(ctx, width, groundY, camX, urban) {
    // Cordillera lejana
    ctx.save();
    const farColor = lerpColor('#74C69D', '#94A3B8', urban * 0.7);
    ctx.fillStyle = farColor;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let sx = 0; sx <= width + 40; sx += 40) {
      const wx = sx + camX * 0.22;
      const mh = 135 + Math.sin(wx * 0.0028) * 52 + Math.cos(wx * 0.0065) * 28;
      ctx.lineTo(sx, groundY - mh);
    }
    ctx.lineTo(width, groundY);
    ctx.closePath();
    ctx.fill();

    // Cerros Orientales más cercanos
    const nearColor = lerpColor('#40916C', '#64748B', urban * 0.65);
    ctx.fillStyle = nearColor;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let sx = 0; sx <= width + 30; sx += 30) {
      const wx = sx + camX * 0.42;
      const mh = 82 + Math.sin(wx * 0.0045 + 1.2) * 38 + Math.cos(wx * 0.009) * 18;
      ctx.lineTo(sx, groundY - mh);
    }
    ctx.lineTo(width, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawLoopingClouds(ctx, width, height, camX, timeSec, urban) {
    ctx.save();
    clouds.forEach(c => {
      const totalSpan = 5600;
      const worldX = (c.x - timeSec * c.speed % totalSpan + totalSpan) % totalSpan;
      const sx = worldX - camX * 0.55;
      if (sx < -140 || sx > width + 140) return;
      const sy = height * c.yRatio;
      const localUrban = getUrbanFactor(sx + camX);
      ctx.fillStyle = localUrban > 0.65
        ? 'rgba(226, 232, 240, 0.78)'
        : 'rgba(255, 255, 255, 0.88)';
      ctx.beginPath();
      ctx.arc(sx, sy, 26 * c.scale, 0, Math.PI * 2);
      ctx.arc(sx + 22 * c.scale, sy - 6 * c.scale, 22 * c.scale, 0, Math.PI * 2);
      ctx.arc(sx - 22 * c.scale, sy - 4 * c.scale, 19 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawUrbanSkyline(ctx, width, groundY, camX, timeSec) {
    ctx.save();
    buildings.forEach(b => {
      const sx = b.x - camX;
      if (sx < -120 || sx > width + 120) return;
      const topY = groundY - b.height;

      // Color ladrillo bogotano o concreto moderno
      ctx.fillStyle = b.isFactory
        ? '#57534E'
        : (b.isBrick ? '#B4532A' : '#475569');
      ctx.fillRect(sx, topY, b.width, b.height);

      // Borde sutil
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, topY, b.width, b.height);

      // Si es la Torre Colpatria simbólica, dibujar franjas luminosas verticales
      if (b.isColpatria) {
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(sx + b.width * 0.2, topY - 18, b.width * 0.6, 18);
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
        ctx.beginPath();
        ctx.moveTo(sx + 10, topY + 6);
        ctx.lineTo(sx + 10, groundY - 10);
        ctx.moveTo(sx + b.width - 10, topY + 6);
        ctx.lineTo(sx + b.width - 10, groundY - 10);
        ctx.stroke();
      }

      // Ventanas iluminadas
      ctx.fillStyle = 'rgba(254, 243, 199, 0.75)';
      for (let wy = topY + 14; wy < groundY - 18; wy += 20) {
        for (let wx = sx + 10; wx < sx + b.width - 14; wx += 16) {
          ctx.fillRect(wx, wy, 8, 11);
        }
      }

      // Chimenea industrial si es fábrica (zona Puente Aranda / Carvajal)
      if (b.isFactory) {
        ctx.fillStyle = '#44403C';
        ctx.fillRect(sx + b.width - 22, topY - 34, 14, 34);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(sx + b.width - 22, topY - 28, 14, 6);
        // Penacho de humo subiendo
        for (let p = 0; p < 3; p++) {
          const drift = ((timeSec * 22 + p * 18) % 54);
          ctx.fillStyle = `rgba(120, 113, 108, ${0.42 - drift * 0.006})`;
          ctx.beginPath();
          ctx.arc(sx + b.width - 15 + drift * 0.4, topY - 38 - drift, 10 + p * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    ctx.restore();
  }

  function drawTreesAndFlora(ctx, width, groundY, camX, timeSec) {
    ctx.save();
    trees.forEach(t => {
      const sx = t.x - camX;
      if (sx < -90 || sx > width + 90) return;
      const sway = Math.sin(timeSec * 1.8 + t.x * 0.02) * 3;

      // Tronco
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(sx - 6, groundY - t.height, 12, t.height);

      // Ramas laterales
      ctx.strokeStyle = '#5C4033';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, groundY - t.height * 0.65);
      ctx.lineTo(sx - 18, groundY - t.height * 0.82);
      ctx.moveTo(sx, groundY - t.height * 0.55);
      ctx.lineTo(sx + 16, groundY - t.height * 0.74);
      ctx.stroke();

      // Copa frondosa verde esmeralda y menta
      const cx = sx + sway;
      const cy = groundY - t.height;
      const r = t.crownRadius;

      ctx.fillStyle = t.kind === 'aliso' ? '#2D6A4F' : '#1B4332';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.6, cy + 8, r * 0.78, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.6, cy + 8, r * 0.78, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#52B788';
      ctx.beginPath();
      ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.65, 0, Math.PI * 2);
      ctx.fill();

      if (t.hasFlowers) {
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(cx - 12, cy - 6, 4, 0, Math.PI * 2);
        ctx.arc(cx + 14, cy + 4, 4, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 16, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Arbustos y flores silvestres
    flora.forEach(f => {
      const sx = f.x - camX;
      if (sx < -40 || sx > width + 40) return;
      ctx.fillStyle = '#40916C';
      ctx.beginPath();
      ctx.arc(sx, groundY - 4, f.size, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = f.flowerColor;
      ctx.beginPath();
      ctx.arc(sx - 3, groundY - f.size, 3, 0, Math.PI * 2);
      ctx.arc(sx + 5, groundY - f.size * 0.8, 2.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawGround(ctx, width, height, groundY, camX, urban) {
    ctx.save();
    // Banda superior de pasto o andén
    ctx.fillStyle = lerpColor('#2D6A4F', '#475569', urban * 0.85);
    ctx.fillRect(0, groundY, width, 16);

    // Subsuelo
    ctx.fillStyle = lerpColor('#1B4332', '#334155', urban * 0.85);
    ctx.fillRect(0, groundY + 16, width, height - groundY - 16);

    // Si estamos en zona urbana, dibujar líneas de ciclorruta / vía bogotana
    if (urban > 0.35) {
      ctx.fillStyle = `rgba(250, 204, 21, ${urban * 0.75})`;
      const offset = -(camX % 60);
      for (let x = offset; x < width; x += 60) {
        ctx.fillRect(x, groundY + 36, 32, 5);
      }
    }
    ctx.restore();
  }

  function drawObstacles(ctx, width, height, camX, timeSec, state) {
    WORLD_OBSTACLES.forEach(obs => {
      const sx = obs.x - camX;
      if (sx < -140 || sx > width + 140) return;
      const sy = height * obs.yRatio + Math.sin(timeSec * 2.1 + obs.x) * 14;
      const isHovered = !!(state && state.hoveredObstacle && state.hoveredObstacle.id === obs.id);

      ctx.save();

      // Halo resaltado si el usuario tiene el cursor encima
      if (isHovered) {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sx, sy, obs.radius + 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.beginPath();
        ctx.arc(sx, sy, obs.radius + 8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (obs.type === 'smog') {
        // Nube tóxica de PM10
        const grad = ctx.createRadialGradient(sx, sy, 8, sx, sy, obs.radius);
        grad.addColorStop(0, 'rgba(120, 53, 15, 0.78)');
        grad.addColorStop(0.6, 'rgba(180, 83, 9, 0.45)');
        grad.addColorStop(1, 'rgba(180, 83, 9, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(87, 83, 78, 0.82)';
        ctx.beginPath();
        ctx.arc(sx - 16, sy, 24, 0, Math.PI * 2);
        ctx.arc(sx + 16, sy - 6, 26, 0, Math.PI * 2);
        ctx.arc(sx, sy + 8, 22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Vórtice numérico / Remolino
        ctx.strokeStyle = obs.type === 'turbulence' ? '#DC2626' : '#D97706';
        ctx.lineWidth = isHovered ? 3.5 : 2.5;
        for (let r = 12; r <= obs.radius - 6; r += 10) {
          ctx.beginPath();
          ctx.arc(sx, sy, r, timeSec * 4 + r, timeSec * 4 + r + Math.PI * 1.35);
          ctx.stroke();
        }
      }

      // Etiqueta flotante del obstáculo (con fondo resaltado si está hovered)
      const badgeW = 220;
      ctx.font = isHovered ? '700 11.5px Inter, sans-serif' : '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isHovered ? '#FEF3C7' : 'rgba(18, 38, 30, 0.88)';
      ctx.strokeStyle = isHovered ? '#B45309' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isHovered ? 2 : 1;
      roundRect(ctx, sx - badgeW / 2, sy - obs.radius - 23, badgeW, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isHovered ? '#B45309' : '#FDE047';
      const labelText = isHovered ? `ℹ️ ${obs.label}` : obs.label;
      ctx.fillText(labelText, sx, sy - obs.radius - 9);
      ctx.restore();
    });
  }

  function drawWorldStops(ctx, width, groundY, camX, state, timeSec) {
    WORLD_STOPS.forEach(stop => {
      const sx = stop.x - camX;
      if (sx < -160 || sx > width + 160) return;

      const isNearby = state.nearbyStop && state.nearbyStop.id === stop.id;
      const isVisited = state.visitedStops.has(stop.id);
      const baseY = groundY;

      ctx.save();

      // Halo luminoso de estación
      const pulse = 1 + Math.sin(timeSec * 3.5) * 0.08;
      const haloGrad = ctx.createRadialGradient(sx, baseY - 70, 10, sx, baseY - 70, 82 * pulse);
      if (stop.isSimulator) {
        haloGrad.addColorStop(0, 'rgba(217, 119, 6, 0.38)');
        haloGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
      } else if (stop.kind === 'nest') {
        haloGrad.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
        haloGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      } else {
        haloGrad.addColorStop(0, 'rgba(64, 145, 108, 0.34)');
        haloGrad.addColorStop(1, 'rgba(64, 145, 108, 0)');
      }
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(sx, baseY - 70, 82 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Dibujo específico de la estructura o amigo
      drawStopStructureOrFriend(ctx, stop, sx, baseY, timeSec);

      // Placa con el nombre de la parada
      const badgeY = baseY - 165;
      ctx.fillStyle = isNearby ? '#1B4332' : 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = isVisited ? '#2D6A4F' : '#94A3B8';
      ctx.lineWidth = 2;
      roundRect(ctx, sx - 110, badgeY, 220, 32, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isNearby ? '#FFFFFF' : '#12261E';
      ctx.fillText(`${stop.icon} ${stop.shortLabel}`, sx, badgeY + 20);

      // Si Rufino está cerca, mostrar cartel parpadeante "[ESPACIO] ABRIR"
      if (isNearby) {
        const promptOffset = Math.sin(timeSec * 6) * 4;
        ctx.fillStyle = '#F59E0B';
        roundRect(ctx, sx - 96, badgeY - 34 + promptOffset, 192, 26, 13);
        ctx.fill();
        ctx.font = '800 11.5px Outfit, sans-serif';
        ctx.fillStyle = '#12261E';
        ctx.fillText('✨ OPRIME [ESPACIO] O CLIC ✨', sx, badgeY - 17 + promptOffset);
      }

      ctx.restore();
    });
  }

  function drawStopStructureOrFriend(ctx, stop, sx, baseY, timeSec) {
    if (stop.spriteType === 'owl') {
      // Pedestal de tronco y Búho Sabio
      ctx.fillStyle = '#6B4423';
      ctx.fillRect(sx - 12, baseY - 82, 24, 82);
      ctx.fillStyle = '#8B5A2B';
      ctx.beginPath();
      ctx.ellipse(sx, baseY - 98, 22, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ojos grandes del búho
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(sx - 8, baseY - 104, 7, 0, Math.PI * 2);
      ctx.arc(sx + 8, baseY - 104, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(sx - 8, baseY - 104, 3.2, 0, Math.PI * 2);
      ctx.arc(sx + 8, baseY - 104, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (stop.spriteType === 'greenhouse') {
      // Domo de cristal del Jardín Botánico
      ctx.fillStyle = 'rgba(209, 250, 229, 0.85)';
      ctx.strokeStyle = '#2D6A4F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, baseY, 64, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Arcos del domo
      ctx.beginPath();
      ctx.arc(sx, baseY, 42, Math.PI, 0);
      ctx.moveTo(sx, baseY - 64);
      ctx.lineTo(sx, baseY);
      ctx.stroke();
    } else if (stop.spriteType === 'teleferico') {
      // Torre de Teleférico e Iglesia de Monserrate
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx - 28, baseY);
      ctx.lineTo(sx - 8, baseY - 120);
      ctx.lineTo(sx + 8, baseY - 120);
      ctx.lineTo(sx + 28, baseY);
      ctx.stroke();
      // Cabina del teleférico
      const cabY = baseY - 88 + Math.sin(timeSec * 2) * 6;
      ctx.fillStyle = '#DC2626';
      roundRect(ctx, sx - 20, cabY, 40, 26, 6);
      ctx.fill();
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(sx - 14, cabY + 5, 28, 11);
    } else if (stop.spriteType === 'hummingbird') {
      // Estación de Laboratorio + Colibrí esmeralda
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(sx - 34, baseY - 65, 68, 65);
      ctx.strokeRect(sx - 34, baseY - 65, 68, 65);
      const hy = baseY - 102 + Math.sin(timeSec * 8) * 5;
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.ellipse(sx, hy, 16, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 14, hy - 2);
      ctx.lineTo(sx + 28, hy - 4);
      ctx.stroke();
    } else if (stop.spriteType === 'balloon') {
      // Globo Meteorológico cautivo
      const by = baseY - 115 + Math.sin(timeSec * 2.2) * 8;
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, baseY);
      ctx.lineTo(sx, by + 20);
      ctx.stroke();
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(sx, by, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(sx - 8, by - 8, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (stop.spriteType === 'control_tower') {
      // Gran Torre de Control Ambiental del Simulador (Carvajal-Kennedy)
      ctx.fillStyle = '#334155';
      ctx.fillRect(sx - 38, baseY - 128, 76, 128);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(sx - 44, baseY - 136, 88, 12);
      // Pantalla luminosa en la torre
      ctx.fillStyle = '#10B981';
      ctx.fillRect(sx - 26, baseY - 108, 52, 34);
      ctx.font = '700 10px Fira Code, monospace';
      ctx.fillStyle = '#052E16';
      ctx.textAlign = 'center';
      ctx.fillText('SIM 2D', sx, baseY - 88);
    } else if (stop.spriteType === 'tingua') {
      // Espejo de agua del Parque Simón Bolívar y Tingua Azul
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.ellipse(sx, baseY - 6, 52, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1D4ED8';
      ctx.beginPath();
      ctx.ellipse(sx, baseY - 22, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(sx + 16, baseY - 26);
      ctx.lineTo(sx + 26, baseY - 23);
      ctx.lineTo(sx + 16, baseY - 20);
      ctx.fill();
    } else if (stop.spriteType === 'nest') {
      // Gran Árbol del Nido Final de Rufino
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(sx - 16, baseY - 110, 32, 110);
      ctx.fillStyle = '#2D6A4F';
      ctx.beginPath();
      ctx.arc(sx, baseY - 122, 56, 0, Math.PI * 2);
      ctx.fill();
      // El Nido tejido
      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.ellipse(sx, baseY - 95, 34, 15, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Huevitos del copetón en el nido
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.ellipse(sx - 8, baseY - 98, 6, 8, -0.2, 0, Math.PI * 2);
      ctx.ellipse(sx + 8, baseY - 98, 6, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCopeton(ctx, screenX, screenY, bird, timeSec) {
    ctx.save();
    ctx.translate(screenX, screenY);
    if (bird.facing < 0) {
      ctx.scale(-1, 1);
    }
    // Inclinación suave según velocidad vertical
    const pitch = Math.max(-0.35, Math.min(0.35, bird.vy * 0.04));
    ctx.rotate(pitch);

    const wingFlap = Math.sin(timeSec * 15) * 14;

    // Cola marrón rojiza característica del Copetón
    ctx.fillStyle = '#7C2D12';
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-36, -6);
    ctx.lineTo(-34, 8);
    ctx.closePath();
    ctx.fill();

    // Cuerpo rechoncho (pecho gris claro / dorso pardo)
    ctx.fillStyle = '#E7E5E4';
    ctx.beginPath();
    ctx.ellipse(0, 4, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dorso marrón andino
    ctx.fillStyle = '#9A3412';
    ctx.beginPath();
    ctx.ellipse(-2, -1, 18, 10, -0.15, Math.PI, 0);
    ctx.fill();

    // Collar rufo / canela distintivo de Zonotrichia capensis
    ctx.fillStyle = '#C2410C';
    ctx.beginPath();
    ctx.arc(8, 0, 10, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.fill();

    // Ala batiente
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-12, -18 - wingFlap, 8, -12 - wingFlap * 0.6);
    ctx.quadraticCurveTo(6, 4, -4, 0);
    ctx.fill();

    // Cabeza con franjas negras y grises
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(14, -6, 11, 0, Math.PI * 2);
    ctx.fill();

    // Franja ocular negra del copetón
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(6, -9);
    ctx.lineTo(21, -9);
    ctx.stroke();

    // EL COPETE (Cresta levantada característica del Copetón Bogotano)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(8, -14);
    ctx.lineTo(12, -26);
    ctx.lineTo(16, -23);
    ctx.lineTo(19, -25);
    ctx.lineTo(20, -14);
    ctx.closePath();
    ctx.fill();

    // Ojo vivo con brillo blanco
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(17, -7, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(18, -8, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Pico cónico granívoro
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(24, -8);
    ctx.lineTo(33, -5);
    ctx.lineTo(24, -2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return {
    render,
    getUrbanFactor
  };
})();

