document.addEventListener("DOMContentLoaded", () => {
  //ПОЯВЛЕНИЕ НОМЕРА ПАРТИИ В ШАПКЕ (ЧЕРЕЗ 2 СЕК) 
  setTimeout(() => {
    const batchNum = document.getElementById('batch-number');
    if(batchNum) batchNum.style.opacity = '1';
  }, 1500);
  //СЧЕТЧИК ДАТ В ШАПКЕ    
  function createDateHTML(dateString) {
    return dateString.split('').map(char => {
      if(char === '.') return `<span class="date-dot">.</span>`;
      return `<div class="digit-box">${char}</div>`;
    }).join('');
  }

  function animateDateCounter(element) {
    const targetStr = element.getAttribute('data-target');
    const duration = parseInt(element.getAttribute('data-duration')) || 2000;
    if(!targetStr) return;
    element.innerHTML = createDateHTML("00.00.0000");
    const targetParts = targetStr.split('.').map(Number);
    if(targetParts.length !== 3) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if(!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const curDD = Math.floor(progress * targetParts[0]).toString().padStart(2, '0');
      const curMM = Math.floor(progress * targetParts[1]).toString().padStart(2, '0');
      const curYYYY = Math.floor(progress * targetParts[2]).toString().padStart(4, '0');
      element.innerHTML = createDateHTML(`${curDD}.${curMM}.${curYYYY}`);
      if(progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
  document.querySelectorAll('.date-display').forEach(animateDateCounter);
  // АНИМИРОВАННЫЙ ГРАФИК СЛОЖНОСТИ   
  let compChartInitialized = false;
  let currentChartPoints = [];
  const numPoints = 20;
  let currentComplexityPercent = 50;

  function getRectSize() {
    if(window.innerWidth <= 576) {
      return {
        w: 8,
        h: 8
      };
    } else {
      return {
        w: 18,
        h: 12
      };
    }
  }

  function setComplexityVisual(percent) {
    const compVal = document.getElementById('comp-val');
    const compFill = document.getElementById('comp-fill');
    const compBarBg = document.querySelector('.comp-bar-bg');
    if(!compVal || !compFill || !compBarBg) return;
    const barHeight = compBarBg.clientHeight;
    const fillHeight = (barHeight * percent) / 100;
    const fillTop = barHeight - fillHeight;
    compFill.style.height = `${percent}%`;
    compVal.style.top = `${fillTop}px`;
    compVal.innerHTML = `${Math.round(percent)}% <span>►</span>`;
  }

  function animateComplexityValue(fromPercent, toPercent, duration = 600) {
    let startTime = null;

    function step(timestamp) {
      if(!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = fromPercent + (toPercent - fromPercent) * easeProgress;
      setComplexityVisual(current);
      if(progress < 1) {
        requestAnimationFrame(step);
      } else {
        currentComplexityPercent = toPercent;
      }
    }
    requestAnimationFrame(step);
  }

  function initComplexityChart() {
    const svg = document.getElementById('comp-svg');
    if(!svg) return false;
    svg.innerHTML = '';
    currentChartPoints = [];
    const w = svg.clientWidth;
    const h = svg.clientHeight;
    if(w === 0 || h === 0) return false;
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#070707");
    polyline.setAttribute("stroke-width", "2");
    polyline.setAttribute("id", "comp-line");
    svg.appendChild(polyline);
    const rectSize = getRectSize();
    const availableW = w - rectSize.w;
    const stepX = availableW / (numPoints - 1);
    for(let i = 0; i < numPoints; i++) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("fill", "#070707");
      rect.setAttribute("id", `comp-rect-${i}`);
      svg.appendChild(rect);
      currentChartPoints.push({
        x: (rectSize.w / 2) + i * stepX,
        y: h / 2
      });
    }
    compChartInitialized = true;
    return true;
  }

  function animateChart(targetPoints, duration) {
    let startTime = null;
    const startPoints = JSON.parse(JSON.stringify(currentChartPoints));
    const polyline = document.getElementById('comp-line');
    const rectSize = getRectSize();

    function step(timestamp) {
      if(!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const pointsStringArr = [];
      for(let i = 0; i < numPoints; i++) {
        const curX = startPoints[i].x + (targetPoints[i].x - startPoints[i].x) * easeProgress;
        const curY = startPoints[i].y + (targetPoints[i].y - startPoints[i].y) * easeProgress;
        currentChartPoints[i] = {
          x: curX,
          y: curY
        };
        pointsStringArr.push(`${curX},${curY}`);
        const rect = document.getElementById(`comp-rect-${i}`);
        if(rect) {
          rect.setAttribute("width", rectSize.w);
          rect.setAttribute("height", rectSize.h);
          rect.setAttribute("x", curX - rectSize.w / 2);
          rect.setAttribute("y", curY - rectSize.h / 2);
        }
      }
      if(polyline) {
        polyline.setAttribute("points", pointsStringArr.join(" "));
      }
      if(progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function generateComplexity() {
    const svg = document.getElementById('comp-svg');
    if(!svg) return;
    const w = svg.clientWidth;
    const h = svg.clientHeight;
    if(!compChartInitialized) {
      if(!initComplexityChart()) return;
    }
    const randomPercent = Math.floor(Math.random() * 70) + 15;
    animateComplexityValue(currentComplexityPercent, randomPercent, 600);
    let targetPoints = [];
    const rectSize = getRectSize();
    const availableW = w - rectSize.w;
    const stepX = availableW / (numPoints - 1);
    for(let i = 0; i < numPoints; i++) {
      let targetX;
      const baseX = (rectSize.w / 2) + (i * stepX);
      if(i === 0 || i === numPoints - 1) {
        targetX = baseX;
      } else {
        const offset = (Math.random() * 0.8 - 0.4) * stepX;
        targetX = baseX + offset;
      }
      const targetY = Math.floor(Math.random() * (h * 0.7)) + (h * 0.15);
      targetPoints.push({
        x: targetX,
        y: targetY
      });
    }
    animateChart(targetPoints, 600);
  }
  setTimeout(() => {
    setComplexityVisual(currentComplexityPercent);
    generateComplexity();
  }, 100);
  window.addEventListener('resize', () => {
    compChartInitialized = false;
    setTimeout(() => {
      generateComplexity();
    }, 100);
  });
  //ДЛЯ БЛОКА "ИТОГ"     
  const durArr = ["10 МИНУТ", "1 ЧАС", "1 ДЕНЬ", "7 ДНЕЙ", "30 ДНЕЙ"];
  const tarArr = ["БАЗОВЫЙ", "PRO", "VIP"];
  let currLang = "";
  let currDur = durArr[1];
  let currTar = tarArr[1];
  //ОБНОВЛЕНИЕ БЛОКА ИТОГ      
  function updateSummary() {
    const sumEmpty = document.getElementById('sum-empty');
    const sumFilled = document.getElementById('sum-filled');
    const resLang = document.getElementById('res-lang');
    const resDur = document.getElementById('res-dur');
    const resTar = document.getElementById('res-tar');
    const btnOrder = document.getElementById('btn-order');
    if(!sumEmpty || !sumFilled || !resLang || !resDur || !resTar || !btnOrder) return;
    if(currLang !== "") {
      sumEmpty.style.display = 'none';
      sumFilled.style.display = 'block';
      btnOrder.style.display = 'block';
      resLang.textContent = `[ ${currLang.toUpperCase()} ]`;
      resDur.textContent = `[ ${currDur} ]`;
      resTar.textContent = `[ ТАРИФ ${currTar} ]`;
    } else {
      sumEmpty.style.display = 'flex';
      sumFilled.style.display = 'none';
      btnOrder.style.display = 'none';
    }
    updateSummaryLoader();
  }
  //КЛИК ПО ПУНКТУ ЯЗЫКА  
  function slideDown(el, callback) {
    if(!el) return;
    el.style.transition = 'none';
    el.style.height = '0px';
    el.style.overflow = 'hidden';
    el.style.display = 'block';
    void el.offsetHeight;
    const h = el.scrollHeight;
    el.style.transition = 'height 0.35s ease';
    el.style.height = h + 'px';

    function onEnd(e) {
      if(e.propertyName !== 'height') return;
      el.removeEventListener('transitionend', onEnd);
      el.style.height = 'auto';
      el.style.overflow = '';
      if(callback) callback();
    }
    el.addEventListener('transitionend', onEnd);
  }

  function slideUp(el, callback) {
    if(!el) return;
    el.style.transition = 'none';
    el.style.height = el.scrollHeight + 'px';
    el.style.overflow = 'hidden';
    void el.offsetHeight;
    el.style.transition = 'height 0.35s ease';
    el.style.height = '0px';

    function onEnd(e) {
      if(e.propertyName !== 'height') return;
      el.removeEventListener('transitionend', onEnd);
      if(callback) callback();
    }
    el.addEventListener('transitionend', onEnd);
  }

  function resetItemVisible(wrapper) {
    if(!wrapper) return;
    const item = wrapper.querySelector('.lang-select-item');
    const mob = wrapper.querySelector('.lang-select-info-mob');
    if(item) {
      item.style.transition = 'none';
      item.style.height = 'auto';
      item.style.overflow = '';
      item.style.display = '';
    }
    if(mob) {
      mob.style.transition = 'none';
      mob.style.height = '0px';
      mob.style.overflow = 'hidden';
    }
  }

  function fillMobBlock(mobBlock, data) {
    mobBlock.innerHTML = `
        <div class="lang-mob-inner">
            <div class="lang-mob-title">
                <span class="lang-mob-main">${data.title}</span>
                <span class="lang-mob-sub">${data.subtitle}</span>
            </div>
            <div class="lang-mob-screen">
			<div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>
                <img src="${data.imgSrc}" alt="Символ">
            </div>
            <div class="lang-mob-stats">
                <div class="lang-mob-stat"><span>Доза:</span><span>${data.dose}</span></div>
                <div class="lang-mob-stat"><span>Загрузка:</span><span>${data.symbols}</span></div>
                <div class="lang-mob-stat"><span>Диалект:</span><span>${data.dialects}</span></div>
            </div>
        </div>
    `;
  }

  function getWrapperData(wrapper) {
    return {
      title: wrapper.getAttribute('data-title') || "",
      subtitle: wrapper.getAttribute('data-subtitle') || "",
      imgSrc: wrapper.getAttribute('data-img') || "",
      dose: wrapper.getAttribute('data-dose') || "",
      symbols: wrapper.getAttribute('data-symbols') || "",
      dialects: wrapper.getAttribute('data-dialects') || ""
    };
  }
  const allWrappers = document.querySelectorAll('.lang-select-item-wrapper');
  const detailHeader = document.getElementById('detail-header');
  const detailEmpty = document.getElementById('detail-empty');
  const detailImageBox = document.getElementById('detail-image-box');
  const detailStats = document.getElementById('detail-stats');
  allWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', function(e) {
      const isMobile = window.innerWidth <= 576;
      const isAlreadyActive = this.classList.contains('active');
      const data = getWrapperData(this);
      // Если клик пришёл из мобильного раскрытого блока — сворачиваем
      if(isMobile && e.target.closest('.lang-select-info-mob') && isAlreadyActive) {
        this.classList.remove('active');
        const langItem = this.querySelector('.lang-select-item');
        const mobBlock = this.querySelector('.lang-select-info-mob');
        slideUp(mobBlock);
        slideDown(langItem);
        currLang = "";
        updateSummary();
        return;
      }
      // Если клик по уже активному заголовку на мобилке — тоже не нужен
      // (заголовок уже скрыт, сюда не попадём)
      if(isMobile) {
        allWrappers.forEach(w => {
          if(w !== this && w.classList.contains('active')) {
            w.classList.remove('active');
            resetItemVisible(w);
          }
        });
        if(isAlreadyActive) {
          return;
        }
        this.classList.add('active');
        const langItem = this.querySelector('.lang-select-item');
        const mobBlock = this.querySelector('.lang-select-info-mob');
        fillMobBlock(mobBlock, data);
        slideUp(langItem);
        slideDown(mobBlock);
      } else {
        allWrappers.forEach(w => w.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('dt-title').innerText = data.title;
        document.getElementById('dt-sub').innerHTML = data.subtitle;
        document.getElementById('dt-image').src = data.imgSrc;
        document.getElementById('dt-dose').innerText = data.dose;
        document.getElementById('dt-symbols').innerText = data.symbols;
        document.getElementById('dt-dialects').innerText = data.dialects;
        detailEmpty.style.display = 'none';
        detailHeader.style.display = 'block';
        detailImageBox.style.display = 'block';
        detailStats.style.display = 'flex';
      }
      currLang = data.title;
      updateSummary();
      generateComplexity();
      updateStorageFromLanguage(this);
    });
  });
  //(ОТРИСОВКА И СОБЫТИЯ)    
  const ranges = document.querySelectorAll('.cyber-range');
  ranges.forEach(range => {
    const updateRangeFill = (el) => {
      const min = el.min || 0;
      const max = el.max || 100;
      const val = el.value;
      const percentage = ((val - min) / (max - min)) * 100;
      el.style.setProperty('--val', `${percentage}%`);
    };
    range.addEventListener('input', function() {
      updateRangeFill(this);
      // Если дергаем первый ползунок - обновляем длительность
      if(this.id === 'range-dur') currDur = durArr[this.value];
      // Если второй - обновляем тариф
      if(this.id === 'range-tar') currTar = tarArr[this.value];
      // Обновляем итог и дергаем график  при движении ползунка!
      updateSummary();
      generateComplexity();
    });
    updateRangeFill(range);
  });

  function updateSummaryLoader() {
    const loader = document.getElementById('summary-loader-fill');
    if(!loader) return;
    // если язык еще не выбран — полоса пустая
    if(!currLang) {
      loader.style.width = '0%';
      return;
    }
    //иначе рандомная заполненность
    const randomWidth = Math.floor(Math.random() * 75) + 10;
    loader.style.width = randomWidth + '%';
  }
  const orderButton = document.getElementById('btn-order');
  if(orderButton) {
    orderButton.addEventListener('click', function() {
      alert('Ваш заказ принят, ожидайте');
    });
  }
  //ПОКАЗАНИЯ И ПОБОЧНЫЕ ДЕЙСТВИЯ    
  const indicationsData = ["Хроническое незнание", "Командировка в древность", "Экзаменационная паника", "Потеря памяти", "Подготовка к семинару", "Срочный перевод табличек", "Чтение древних текстов", "Научная конференция", "Работа в архиве", "Подготовка к раскопкам"];
  const effectsData = ["Желание цитировать Цезаря", "Разговоры с котами на латыни", "Сны на акадском", "Тяга к клинописи", "Желание писать на стенах", "Навязчивое чтение надписей", "Любовь к древним словарям", "Разговоры о фараонах", "Случайные шумеризмы", "Страсть к папирусам"];
  let indicationsIndex = 0;
  let effectsIndex = 0;
  let infoListsStarted = false;
  /* первая отрисовка — сразу, без анимации */
  function renderInitialThreeItems(containerId, items, startIndex) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    for(let i = 0; i < 3; i++) {
      const index = (startIndex + i) % items.length;
      const item = document.createElement('div');
      item.className = 'info-list-item';
      item.innerHTML = `
            <img src="./images/check.svg" alt="">
            <span>${items[index]}</span>
        `;
      container.appendChild(item);
    }
  }
  //поштучная смена 3 строк  
  function animateThreeItems(containerId, items, startIndex) {
    const container = document.getElementById(containerId);
    if(!container) return;
    const currentItems = container.querySelectorAll('.info-list-item');
    if(currentItems.length !== 3) {
      renderInitialThreeItems(containerId, items, startIndex);
      return;
    }
    currentItems.forEach((itemEl, i) => {
      setTimeout(() => {
        itemEl.classList.add('is-out');
        setTimeout(() => {
          const nextIndex = (startIndex + i) % items.length;
          itemEl.innerHTML = `
                    <img src="./images/check.svg" alt="">
                    <span>${items[nextIndex]}</span>
                `;
          itemEl.classList.remove('is-out');
          itemEl.classList.add('is-in');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              itemEl.classList.remove('is-in');
            });
          });
        }, 220);
      }, i * 140);
    });
  }

  function initInfoLists() {
    renderInitialThreeItems('indications-list', indicationsData, indicationsIndex);
    renderInitialThreeItems('effects-list', effectsData, effectsIndex);
    if(infoListsStarted) return;
    infoListsStarted = true;
    setInterval(() => {
      indicationsIndex = (indicationsIndex + 3) % indicationsData.length;
      effectsIndex = (effectsIndex + 3) % effectsData.length;
      animateThreeItems('indications-list', indicationsData, indicationsIndex);
      animateThreeItems('effects-list', effectsData, effectsIndex);
    }, 3000);
  }
  //УСЛОВИЯ ХРАНЕНИЯ    
  function animateStorageValue(elementId, endValue, duration = 1200, decimals = 0) {
    const el = document.getElementById(elementId);
    if(!el) return;
    let startTimestamp = null;

    function step(timestamp) {
      if(!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * endValue;
      if(decimals > 0) {
        el.textContent = current.toFixed(decimals);
      } else {
        el.textContent = Math.floor(current);
      }
      if(progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function updateStorageFromLanguage(item) {
    if(!item) return;
    const years = parseFloat(item.getAttribute('data-st-years')) || 0;
    const press = parseFloat(item.getAttribute('data-st-press')) || 0;
    const temp = parseFloat(item.getAttribute('data-st-temp')) || 0;
    const hum = parseFloat(item.getAttribute('data-st-hum')) || 0;
    animateStorageValue('storage-years', years, 3000, 0);
    animateStorageValue('storage-press', press, 3000, press % 1 !== 0 ? 1 : 0);
    animateStorageValue('storage-temp', temp, 3000, 0);
    animateStorageValue('storage-hum', hum, 3000, 0);
  }
  initInfoLists();
  const firstLangItem = document.querySelector('.lang-select-item');
  if(firstLangItem) {
    updateStorageFromLanguage(firstLangItem);
  }
});
