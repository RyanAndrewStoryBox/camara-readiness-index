// CAMARA Readiness Index — Main application v2
// Fetches data from Airtable and renders the leaderboard + provider profiles

(function () {
    'use strict';

    var API_URL = 'https://api.airtable.com/v0/' + CONFIG.AIRTABLE_BASE_ID;

    function headers() {
        return { Authorization: 'Bearer ' + CONFIG.AIRTABLE_API_TOKEN };
    }

    // --- Airtable fetch (handles pagination) ---
    async function fetchTable(tableId) {
        var allRecords = [];
        var offset = null;
        do {
            var url = API_URL + '/' + tableId + (offset ? '?offset=' + offset : '');
            var res = await fetch(url, { headers: headers() });
            if (!res.ok) throw new Error('Airtable error: ' + res.status);
            var data = await res.json();
            allRecords = allRecords.concat(data.records);
            offset = data.offset;
        } while (offset);
        return allRecords;
    }

    // --- Country name to ISO 2-letter code ---
    var COUNTRY_ISO = {
        'UK': 'gb', 'Germany': 'de', 'Spain': 'es',
        'Italy': 'it', 'Greece': 'gr', 'Ireland': 'ie',
        'Netherlands': 'nl', 'Portugal': 'pt', 'Romania': 'ro',
        'France': 'fr', 'Sweden': 'se', 'Finland': 'fi',
        'Norway': 'no', 'Denmark': 'dk', 'Estonia': 'ee',
        'Lithuania': 'lt', 'Latvia': 'lv', 'Australia': 'au',
        'Brazil': 'br', 'Croatia': 'hr', 'India': 'in',
        'Argentina': 'ar', 'Singapore': 'sg', 'Thailand': 'th',
        'Indonesia': 'id', 'Malaysia': 'my', 'Taiwan': 'tw',
        'Canada': 'ca', 'Japan': 'jp', 'USA': 'us',
        'Belgium': 'be', 'Austria': 'at', 'Switzerland': 'ch',
        'Poland': 'pl', 'Czech Republic': 'cz', 'Hungary': 'hu',
        'South Africa': 'za', 'Qatar': 'qa', 'Albania': 'al',
        'Global': 'global'
    };

    // --- Render country flags as <img> from flagcdn.com ---
    function flagsHTML(marketsStr) {
        if (!marketsStr) return '';
        var markets = marketsStr.split(',');
        return markets.map(function (m) {
            var name = m.trim();
            var iso = COUNTRY_ISO[name];
            if (!iso) return '<span class="flag-wrap" title="' + esc(name) + '">' + esc(name) + '</span>';
            if (iso === 'global') return '<span class="flag-wrap"><span class="flag-tip">' + esc(name) + '</span><svg class="flag-img" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg></span>';
            return '<span class="flag-wrap"><span class="flag-tip">' + esc(name) + '</span><img class="flag-img" src="https://flagcdn.com/w40/' + iso + '.png" alt="' + esc(name) + '"></span>';
        }).join('');
    }

    function labelColour(label) {
        return CONFIG.LABEL_COLOURS[label] || '#9ca3af';
    }

    function scoreColour(val) {
        if (val >= 4) return '#22c55e';
        if (val >= 3) return '#f59e0b';
        if (val >= 2) return '#f97316';
        if (val >= 1) return '#ef4444';
        return '#9ca3af';
    }

    // --- Safely get Markets as a string ---
    function getMarkets(fields) {
        var m = fields['Markets'];
        if (!m) return '';
        if (Array.isArray(m)) return m.join(', ');
        return String(m);
    }

    // --- Extract unique markets from all providers ---
    function extractMarkets(providers) {
        var marketSet = {};
        providers.forEach(function (p) {
            var markets = getMarkets(p.fields);
            markets.split(',').forEach(function (m) {
                var trimmed = m.trim();
                if (trimmed) marketSet[trimmed] = true;
            });
        });
        return Object.keys(marketSet).sort();
    }

    // --- Populate the market filter dropdown ---
    function populateMarketFilter(providers) {
        var select = document.getElementById('filter-market');
        if (!select) return;
        var markets = extractMarkets(providers);
        markets.forEach(function (m) {
            var opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            select.appendChild(opt);
        });
    }

    // --- Check if provider matches market filter ---
    function matchesMarket(provider, market) {
        if (!market) return true;
        var markets = getMarkets(provider.fields).split(',').map(function (m) { return m.trim(); });
        return markets.indexOf(market) !== -1;
    }

    // --- HTML escape ---
    function esc(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    // --- Render leaderboard (homepage) ---
    function renderLeaderboard(providers) {
        var container = document.getElementById('leaderboard');
        if (!container) return;

        providers.sort(function (a, b) {
            return (b.fields['Weighted score'] || 0) - (a.fields['Weighted score'] || 0);
        });

        populateMarketFilter(providers);

        var tierFilter = document.getElementById('filter-tier');
        var labelFilter = document.getElementById('filter-label');
        var marketFilter = document.getElementById('filter-market');

        function draw() {
            var tier = tierFilter ? tierFilter.value : '';
            var label = labelFilter ? labelFilter.value : '';
            var market = marketFilter ? marketFilter.value : '';

            var filtered = providers.filter(function (p) {
                if (tier && p.fields['Tier'] !== tier) return false;
                if (label && p.fields['Readiness label'] !== label) return false;
                if (!matchesMarket(p, market)) return false;
                return true;
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div class="no-results">No providers match the selected filters.</div>';
                return;
            }

            container.innerHTML = filtered.map(function (p, i) {
                var f = p.fields;
                var score = f['Weighted score'] || 0;
                var pct = (score / 5 * 100).toFixed(0);
                var t = (f['Tier'] || '?').toUpperCase();
                var rl = f['Readiness label'] || 'Unclear';
                var colour = labelColour(rl);
                var name = f['Provider name'] || 'Unknown';
                var role = f['Role label'] || f['Provider type'] || '';
                var markets = getMarkets(f);
                var access = f['Access model'] || '';
                var ttfc = f['Time to first API call'] || '';

                return '<a href="provider.html?id=' + p.id + '" class="provider-card">' +
                    '<div class="card-rank">' + (i + 1) + '</div>' +
                    '<div class="card-body">' +
                        '<div class="card-top">' +
                            '<span class="tier-badge tier-' + t.toLowerCase() + '">' + t + '</span>' +
                            '<div>' +
                                '<div class="card-name">' + esc(name) + '</div>' +
                                '<div class="card-role">' + esc(role) + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="score-row">' +
                            '<div class="score-bar-track">' +
                                '<div class="score-bar-fill" style="width:' + pct + '%;background:' + colour + '"></div>' +
                            '</div>' +
                            '<span class="readiness-label" style="color:' + colour + '">' + esc(rl) + '</span>' +
                        '</div>' +
                        '<div class="card-meta">' +
                            (markets ? '<span>' + flagsHTML(markets) + '</span>' : '') +
                            (access ? '<span>Access: ' + esc(access) + '</span>' : '') +
                            (ttfc ? '<span>First call: ' + esc(ttfc) + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="card-score-area">' +
                        '<div class="card-score-big" style="color:' + colour + '">' + score.toFixed(1) + '<span class="card-score-max"> / 5</span></div>' +
                    '</div>' +
                '</a>';
            }).join('');
        }

        if (tierFilter) tierFilter.addEventListener('change', draw);
        if (labelFilter) labelFilter.addEventListener('change', draw);
        if (marketFilter) marketFilter.addEventListener('change', draw);
        draw();
    }

    // --- Render provider profile ---
    function renderProfile(provider) {
        var container = document.getElementById('provider-profile');
        if (!container) return;

        var f = provider.fields;
        var score = f['Weighted score'] || 0;
        var pct = (score / 5 * 100).toFixed(0);
        var tier = (f['Tier'] || '?').toUpperCase();
        var rl = f['Readiness label'] || 'Unclear';
        var colour = labelColour(rl);

        var breakdownHTML = CONFIG.CATEGORIES.map(function (cat) {
            var val = f[cat.field];
            if (val === null || val === undefined || val === '') {
                return '<div class="breakdown-row">' +
                    '<span class="breakdown-label">' + cat.label + '</span>' +
                    '<div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:0;background:#9ca3af"></div></div>' +
                    '<span class="breakdown-score breakdown-unknown">Unknown</span>' +
                '</div>';
            }
            var v = Number(val);
            var p = (v / 5 * 100).toFixed(0);
            return '<div class="breakdown-row">' +
                '<span class="breakdown-label">' + cat.label + '</span>' +
                '<div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:' + p + '%;background:' + scoreColour(v) + '"></div></div>' +
                '<span class="breakdown-score">' + v + ' / 5</span>' +
            '</div>';
        }).join('');

        var url = f['Primary URL'] || '';
        var urlDisplay = url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
        var markets = getMarkets(f);

        document.title = (f['Provider name'] || 'Provider') + ' — CAMARA Readiness Index';

        container.innerHTML =
        '<div class="profile-header">' +
            '<div class="card-top">' +
                '<span class="tier-badge tier-' + tier.toLowerCase() + '">' + tier + '</span>' +
                '<div>' +
                    '<div class="card-name" style="font-size:1.5rem">' + esc(f['Provider name'] || '') + '</div>' +
                    '<div class="card-role">' + esc(f['Role label'] || f['Provider type'] || '') + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="profile-meta">' +
                (f['Headquarters'] ? '<span>Headquarters: ' + esc(f['Headquarters']) + '</span><br>' : '') +
                (markets ? '<span>Markets: ' + flagsHTML(markets) + '</span><br>' : '') +
                (url ? '<span>Portal: <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(urlDisplay) + '</a></span><br>' : '') +
                (f['Access model'] ? '<span>Access model: ' + esc(f['Access model']) + '</span>' : '') +
            '</div>' +
            '<div class="score-row">' +
                '<div class="score-bar-track" style="max-width:320px">' +
                    '<div class="score-bar-fill" style="width:' + pct + '%;background:' + colour + '"></div>' +
                '</div>' +
                '<span class="score-num" style="font-size:1.1rem">' + score.toFixed(1) + ' / 5</span>' +
                '<span class="readiness-label" style="color:' + colour + ';font-size:0.95rem">' + esc(rl) + '</span>' +
            '</div>' +
        '</div>' +

        '<div class="breakdown">' +
            '<h2>Score breakdown</h2>' +
            breakdownHTML +
        '</div>' +

        (f['Summary assessment'] ?
        '<div class="profile-section">' +
            '<h2>Assessment summary</h2>' +
            '<p>' + esc(f['Summary assessment']) + '</p>' +
        '</div>' : '') +

        '<div class="strengths-limits">' +
            '<div class="sl-box">' +
                '<h3>Strengths</h3>' +
                '<p>' + esc(f['Strengths'] || 'Not yet assessed.') + '</p>' +
            '</div>' +
            '<div class="sl-box">' +
                '<h3>Limitations</h3>' +
                '<p>' + esc(f['Limitations'] || 'Not yet assessed.') + '</p>' +
            '</div>' +
        '</div>' +

        '<div class="profile-info">' +
            (f['Time to first API call'] ? '<span>Time to first API call: ' + esc(f['Time to first API call']) + '</span>' : '') +
            (f['Assessment date'] ? '<span>Assessed: ' + esc(f['Assessment date']) + '</span>' : '') +
        '</div>';
    }

    // --- Init ---
    async function init() {
        if (!CONFIG.AIRTABLE_API_TOKEN || CONFIG.AIRTABLE_API_TOKEN === 'YOUR_TOKEN_HERE') {
            var target = document.getElementById('leaderboard') || document.getElementById('provider-profile');
            if (target) target.innerHTML = '<div class="error">Airtable API token not configured. Open config.js and paste your token.</div>';
            return;
        }

        try {
            var isProviderPage = !!document.getElementById('provider-profile');
            var isHomePage = !!document.getElementById('leaderboard');

            if (isProviderPage) {
                var id = new URLSearchParams(window.location.search).get('id');
                if (!id) {
                    document.getElementById('provider-profile').innerHTML = '<div class="error">No provider specified.</div>';
                    return;
                }
                var url = API_URL + '/' + CONFIG.TABLES.PROVIDERS + '/' + id;
                var res = await fetch(url, { headers: headers() });
                if (!res.ok) throw new Error('Provider not found');
                var data = await res.json();
                renderProfile(data);
            }

            if (isHomePage) {
                var providers = await fetchTable(CONFIG.TABLES.PROVIDERS);
                renderLeaderboard(providers);
            }
        } catch (err) {
            console.error(err);
            var target = document.getElementById('leaderboard') || document.getElementById('provider-profile');
            if (target) target.innerHTML = '<div class="error">Failed to load data. Check your API token and internet connection.<br><small>' + esc(err.message) + '</small></div>';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
