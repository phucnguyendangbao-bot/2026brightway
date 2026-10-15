import { buildUniversityCatalog } from '../data/university-identities.js';
import { admissionNews } from '../data/admissions-news.js';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const normalize = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const dateLabel = value => new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', timeZone:'UTC' }).format(new Date(value + 'T12:00:00Z'));

export function selectNews(items, { school = 'all', year = '2026', type = 'all', query = '' } = {}) {
  const keyword = normalize(query.trim());
  return items.filter(item =>
    (school === 'all' || item.schoolId === school) &&
    (year === 'all' || item.year === Number(year)) &&
    (type === 'all' || item.type === type) &&
    (!keyword || normalize([item.title, item.description, item.schoolName, item.type].join(' ')).includes(keyword))
  ).sort((a, b) => b.year - a.year || b.published.localeCompare(a.published) || a.title.localeCompare(b.title, 'vi'));
}

async function init() {
  const status = $('newsStatus');
  let schools;
  try {
    const response = await fetch('assets/data/schools.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.json();
    schools = buildUniversityCatalog(raw).schools.filter(school => school.identity.entity_kind === 'university');
  } catch (error) {
    status.textContent = 'Không tải được danh sách trường. Vui lòng tải lại trang.';
    $('newsEmpty').hidden = false;
    console.error('Admissions news: school catalog failed', error);
    return;
  }
  const byId = new Map(schools.map(school => [school.id, school]));
  const rows = admissionNews.filter(item => byId.has(item.schoolId)).map(item => ({ ...item, schoolName:byId.get(item.schoolId).name }));
  schools.sort((a,b) => a.name.localeCompare(b.name, 'vi'));
  $('newsSchool').insertAdjacentHTML('beforeend', schools.map(school => `<option value="${escape(school.id)}">${escape(school.name)}</option>`).join(''));

  function render() {
    const filters = { school:$('newsSchool').value, year:$('newsYear').value, type:$('newsType').value, query:$('newsSearch').value };
    const visible = selectNews(rows, filters);
    const grid = $('resGrid');
    grid.innerHTML = visible.map(item => {
      const school = byId.get(item.schoolId);
      const profile = `page2.html#${encodeURIComponent(school.id)}`;
      const logo = /^assets\/images\//.test(school.logoUrl || '') ? `<img src="${escape(school.logoUrl)}" alt="" loading="lazy">` : `<span class="news-logo-fallback" aria-hidden="true">${escape(school.short || school.name.slice(0, 2))}</span>`;
      return `<article class="res-card news-card">
        <a class="res-thumb news-thumb" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Mở thông báo gốc: ${escape(item.title)}">${logo}<span class="res-cat">${escape(item.type)}</span><span class="res-badge news-year">${item.year}</span></a>
        <div class="res-body"><p class="res-provider">${escape(school.name)} · <time datetime="${escape(item.published)}">${dateLabel(item.published)}</time></p>
        <h2 class="res-title"><a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.title)}</a></h2>
        <p class="res-desc">${escape(item.description)}</p>
        <div class="res-foot"><a class="news-profile" href="${profile}">Hồ sơ trường →</a><a class="res-btn" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">Thông báo gốc ↗</a></div></div>
      </article>`;
    }).join('');
    status.textContent = `${visible.length} thông báo đã đối chiếu · ${schools.length} hồ sơ trường trong danh sách`;
    const empty = $('newsEmpty');
    empty.hidden = visible.length > 0;
    $('emptySchoolLink').hidden = filters.school === 'all';
    $('emptySchoolLink').href = filters.school === 'all' ? 'page2.html' : `page2.html#${encodeURIComponent(filters.school)}`;

    const matchingSchools = filters.school === 'all' ? schools : schools.filter(school => school.id === filters.school);
    const withNews = new Set(selectNews(rows, { ...filters, school:'all', query:'' }).map(item => item.schoolId));
    const missing = matchingSchools.filter(school => !withNews.has(school.id));
    const unverified = $('newsUnverified');
    unverified.hidden = missing.length === 0;
    if (!missing.length) unverified.open = false;
    $('unverifiedCount').textContent = `(${missing.length})`;
    $('unverifiedSchools').innerHTML = missing.map(school => `<a href="page2.html#${encodeURIComponent(school.id)}"><span>${escape(school.name)}</span><small>Chưa có thông báo được xác minh</small></a>`).join('');
  }

  for (const id of ['newsSchool','newsYear','newsType']) $(id).addEventListener('change', render);
  $('newsSearch').addEventListener('input', render);
  const requestedSchool = new URLSearchParams(location.search).get('school');
  if (requestedSchool && byId.has(requestedSchool)) $('newsSchool').value = requestedSchool;
  render();
}

if (typeof document !== 'undefined' && document.getElementById('resGrid')) init();
