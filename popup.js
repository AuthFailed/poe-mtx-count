document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;
        const redirectMessage = document.getElementById('redirectMessage');
        const mainContent = document.getElementById('mainContent');

        if (!currentUrl.includes('pathofexile.com/my-account/transactions')) {
            redirectMessage.style.display = 'flex';
            mainContent.style.display = 'none';
            return;
        }

        redirectMessage.style.display = 'none';
        mainContent.style.display = 'block';

        // Execute content script
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: analyzeTransactions
        }).then((results) => {
            if (results && results[0]) {
                displayTransactions(results[0].result);
                setupCopyButton(results[0].result);
            }
        }).catch((err) => {
            console.error('Failed to execute script:', err);
        });
    });
});

function setupCopyButton(data) {
    const copyButton = document.getElementById('copyButton');

    copyButton.addEventListener('click', () => {
        let clipboardText = 'Path of Exile Transaction Summary\n';
        clipboardText += '================================\n\n';

        // Add transactions
        data.transactions.forEach(transaction => {
            clipboardText += `${transaction.name}: $${transaction.price}\n`;
        });

        clipboardText += '\n================================\n';
        clipboardText += `Total spent: $${data.total}\n`;

        // Add POE2 access status
        const POE2_REQUIREMENT = 480;
        if (data.total >= POE2_REQUIREMENT) {
            clipboardText += '\n🎉 Qualified for Path of Exile 2 Beta & Early Access!';
        } else {
            const remaining = POE2_REQUIREMENT - data.total;
            clipboardText += `\nNeed $${remaining} more for Path of Exile 2 Beta & Early Access`;
        }

        // If there are unrecognized items
        if (data.notFound.length > 0) {
            clipboardText += '\n\nUnrecognized items:\n';
            clipboardText += data.notFound.join('\n');
        }

        // Copy to clipboard
        navigator.clipboard.writeText(clipboardText).then(() => {
            showNotification();
        });
    });
}

function showNotification() {
    const notification = document.getElementById('notification');
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// This function will be injected into the page
function analyzeTransactions() {
    const microtransactions = {
        // PoE2 Early Access - New section
        "Path of Exile 2 Early Access": 30,
        "Lord of Ogham": 60,
        "King of the Faridun": 100,
        "Thaumaturge of the Vaal": 160,
        "Warlord of the Karui": 240,
        "Liberator of Wraeclast": 480,

        // Exilecon 2023
        "Exilecon 2023 Ultra VIP": 2000,
        "Exilecon 2023 VIP": 700,
        "Exilecon 2023": 230,
        // will never acually match
        // because "Exilecon 2023" is more expensive
        // TODO: implement Levenshtein distance?
        "Exilecon 2023 Balcony Ticket": 210,

        // Exilecon 2019
        "Exilecon Ultra VIP": 1000,
        "Exilecon VIP": 500,
        "Exilecon": 200,
        // will never acually match
        // because "Exilecon" is more expensive
        // TODO: implement Levenshtein distance?
        "Exilecon Balcony Ticket": 180,

        //Settlers of Kalguur
        "Paladin": 30,
        "Divine Paladin": 60,
        "Sacred Paladin": 90,
        "Penance": 30,
        "Acolytes Penance": 60,
        "Zealots Penance": 90,

        //Necropolis
        "Solar": 30,
        "Solar Knight": 60,
        "Solar Guardian": 90,
        "Eldritch": 30,
        "Eldritch Hunger": 60,
        "Eldritch Horror": 90,

        // 2024 Core
        "Kalguuran Runesmith": 60,
        "Shackled Immortal": 100,
        "Vaal Serpent-God": 160,
        "Karui Elemancer": 240,
        "Sandwraith Assassin": 480,

        // Ancestors
        "Shade": 30,
        "Haunting Shade": 60,
        "Midnight Shade": 90,
        "Disciple": 30,
        "Ardent Disciple": 60,
        "Devoted Disciple": 90,

        // Crucible
        "Lithomancer": 30,
        "Ancestral Lithomancer": 60,
        "Ancient Lithomancer": 90,
        "Enchanter": 30,
        "Master Enchanter": 60,
        "High Enchanter": 90,

        // 2023 Core
        "Tormentor": 60,
        "Hellfire": 100,
        "Bloodthirsty": 160,
        "Chronomancer": 240,
        "Voidborn": 480,

        // The Forbidden Sanctum
        "Forgekeeper": 30,
        "Forgeguard": 60,
        "Forgemaster": 90,
        "Gemling": 30,
        "Gemling Artificer": 60,
        "Gemling Sage": 90,

        // Lake of Kalandra
        "Knight": 30,
        "Knightmaster": 60,
        "Knightlord": 90,
        "Rogue": 30,
        "Rogue Stalker": 60,
        "Rogue Overseer": 90,

        // Sentinel
        "Reaper": 30,
        "Savage Reaper": 60,
        "Sanguine Reaper": 90,
        "Arcanist": 30,
        "Esteemed Arcanist": 60,
        "Grand Arcanist": 90,

        // Archnemesis
        "Wyrm": 30,
        "Wyrmcaller": 60,
        "Wyrmlord": 90,
        "Emberkeep": 30,
        "Elite Emberkeep": 60,
        "Supreme Emberkeep": 90,

        // 2022 Core
        "Imperator": 60,
        "Nullifier": 100,
        "Annihilator": 160,
        "Ravager": 240,
        "Incinerator": 480,

        // Scourge
        "Liege": 30,
        "Intrepid Liege": 60,
        "Triumphant Liege": 90,
        "Dread": 30,
        "Ancient Dread": 60,
        "Primordial Dread": 90,

        // Expedition
        "Soulkeeper": 30,
        "Soulkeeper Vizier": 60,
        // ggg has misspelled this in the account transactions list
        "Soulkeepr Vizier": 60,
        "Soulkeeper Demigod": 90,
        "Aesir": 30,
        "Aesir Warrior": 60,
        "Aesir Demigod": 90,

        // Ultimatum
        "Sun": 30,
        "Imperial Sun": 60,
        "Crescent": 30,
        "Silver Crescent": 60,

        // Ritual
        "Renegade": 30,
        "Deadly Renegade": 60,
        "Faithsworn": 30,
        "Elite Faithsworn": 60,

        // 2021 Core
        "Delve Core": 60,
        "Breach Core": 100,
        "Abyss Core": 160,
        "Harvest Core": 240,
        "Atlas Core": 480,

        // Heist
        "Spellblade": 30,
        "Master Spellblade": 60,
        "Eagle": 30,
        "Imperial Eagle": 60,

        // Harvest
        "Malice": 30,
        "Insatiable Malice": 60,
        "Benevolence": 30,
        "Divine Benevolence": 60,

        // Delirium
        "Fateweaver": 30,
        "Elite Fateweaver": 60,
        "Darkseer": 30,
        "Elder Darkseer": 60,

        // 2020 Core
        "Basilisk": 60,
        "Crusader": 100,
        "Eyrie": 160,
        "Judicator": 240,
        "Orion": 480,

        // Metamorph
        "Sanctum": 30,
        "Grand Sanctum": 60,
        "Damnation": 30,
        "Eternal Damnation": 60,

        // Blight
        "Sentinel": 30,
        "Sentinel Overlord": 60,
        "Lich": 30,
        "Bane Lich": 60,

        // Legion
        "Cult of Darkness": 30,
        "Cult of Apocalypse": 60,
        "Blood Knight": 30,
        "Blood Guardian": 60,

        // Synthesis
        "Sunstone": 30,
        "Sunspire": 60,
        "Doomcrow": 30,
        "Doomguard": 60,

        // 2019 Core
        "Pitfighter": 60,
        "Assassin": 100,
        "Vanguard": 160,
        "Empyrean": 240,
        "Crucible": 480,

        // Betrayal
        "Undertaker": 30,
        "Master Undertaker": 60,
        "Soulstealer": 30,
        "Master Soulstealer": 60,

        // Delve
        "Stalker": 30,
        "Shadowstalker": 60,
        "Forge": 30,
        "Dreadforge": 60,

        // Incursion
        "Council": 30,
        "High Council": 60,
        "Conquest": 30,
        "Grand Conquest": 60,

        // Bestiary
        "Harpy": 30,
        "Alpha Harpy": 60,
        "Manticore": 30,
        "Alpha Manticore": 60,

        // First Blood
        "First Blood": 20,

        // Abyss
        "Abyssal Imp": 60,
        "Abyssal Lich": 60,

        // War for the Atlas
        "Vagabond": 30,
        "Seeker": 60,
        "Scholar": 100,
        "Redeemer": 160,
        "Subjugator": 240,
        "Dominator": 480,

        // Harbinger
        "Portent": 30,
        "Harbinger": 60,

        // The Fall of Oriath
        "Oriath": 30,
        "Outlaw": 60,
        "Legion": 100,
        "Eclipse": 160,
        "Beast": 240,
        "Kitava": 480,

        // Legacy
        "Classic": 30,
        "Legacy": 60,

        // Breach
        "Breachspawn": 30,
        "Breachlord": 60,

        // Atlas of Worlds
        "Minotaur": 50,
        "Hydra": 110,
        "Chimera": 220,
        "Phoenix": 440,

        // Prophecy
        "Prophecy": 60,

        // Ascendancy
        "Aspirant": 50,
        "Challenger": 110,
        "Sovereign": 220,
        "Ascendant": 440,

        // The Awakening
        "Awakening": 30,
        "Axiom": 60,
        "Vaal": 130,
        "Lunaris": 260,
        "Highgate": 1100,

        // Forsaken Masters
        "Apprentice Supporter Pack": 50,
        "Journeyman Supporter Pack": 100,
        "Master Supporter Pack": 200,
        "Grandmaster Supporter Pack": 500,

        // Release
        "Survivor Supporter Pack": 50,
        "Warrior Supporter Pack": 120,
        "Champion Pack": 280,
        "Conqueror Supporter Pack": 900,

        // Open Beta
        "Open Beta": 30,
        "Regal Supporter Pack": 50,
        "Divine Supporter Pack": 110,
        "Divine Pack": 110,
        "Exalted Supporter Pack": 270,
        "Eternal Supporter Pack": 1500,
        "Ruler of Wraeclast": 12500,

        // Closed Beta
        "Early Access": 10,
        "Closed Beta": 15,
        "Gold Pack": 250,
        "Kiwi Supporter Pack": 25,
        "Bronze Pack": 50,
        "Silver Supporter Pack": 100,
        "Gold Supporter Pack": 250,
        "Diamond Supporter Pack": 1000,

        // Straight Points
        "50 Point": 5,
        "100 Point": 10,
        "200 Point": 20,
        "516 Point": 50,
        "1065 Point": 100,

        // Vault Passes
        "Vault Pass": 30,

        // Questionmark
        "Comic": 4,
        "Angelic Mask": 5,
        "Koala": 14,
        "Brazil": 40,
    }

    const transactions = [];
    let total = 0;
    const notFound = [];
    let debugLog = [];

    const transactionElements = document.querySelectorAll('.transaction');

    transactionElements.forEach(transaction => {
        const packageNameElement = transaction.querySelector('.packageName');
        if (packageNameElement) {
            const transactionName = packageNameElement.textContent.trim();
            let price = 0;
            let matchedPack = '';

            for (let mtx in microtransactions) {
                let value = microtransactions[mtx];
                if (transactionName.includes(mtx) && value > price) {
                    price = value;
                    matchedPack = mtx;
                }
            }

            if (price === 0) {
                notFound.push(transactionName);
            }

            const beforeTotal = total;
            total += price;

            // Add to debug log
            debugLog.push({
                name: transactionName,
                matchedPack: matchedPack,
                price: price,
                runningTotal: total
            });

            transactions.push({
                name: transactionName,
                price: price,
                matched: matchedPack || null
            });
        }
    });

    return {
        transactions,
        total,
        notFound,
        debugLog
    };
}

function updatePOE2Tracker(total) {
    const POE2_BETA_REQUIREMENT = 480;
    const trackerElement = document.getElementById('poe2Tracker');
    const remaining = Math.max(0, POE2_BETA_REQUIREMENT - total);
    const progressPercentage = Math.min(100, (total / POE2_BETA_REQUIREMENT) * 100);

    if (total >= POE2_BETA_REQUIREMENT) {
        trackerElement.classList.add('achieved');
        trackerElement.innerHTML = `
            <div class="poe2-header">
                <span class="poe2-title">Path of Exile 2 Access Status</span>
                <span class="poe2-amount">$${total}/$${POE2_BETA_REQUIREMENT}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 100%"></div>
            </div>
            <div class="poe2-message achieved-message">
                🎉 Congratulations! You have qualified for Path of Exile 2 Beta Access & Early Access! 🎉
            </div>
        `;
    } else {
        trackerElement.classList.remove('achieved');
        trackerElement.innerHTML = `
            <div class="poe2-header">
                <span class="poe2-title">Path of Exile 2 Access Progress</span>
                <span class="poe2-amount">$${total}/$${POE2_BETA_REQUIREMENT}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="poe2-message needed-message">
                You need $${remaining} more to qualify for Path of Exile 2 Beta & Early Access
            </div>
        `;
    }
}

function displayTransactions(data) {
    const transactionList = document.getElementById('transactionList');
    const totalElement = document.getElementById('total');
    const notFoundElement = document.getElementById('notFound');

    // Clear previous content
    transactionList.innerHTML = '';
    totalElement.innerHTML = '';
    notFoundElement.innerHTML = '';

    // Display debug log in console
    console.log('Transaction Analysis:', data.debugLog);

    // Display transactions
    data.transactions.forEach(transaction => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.innerHTML = `
            <span class="transaction-name">
                ${transaction.name}
                ${transaction.matched ? `<span class="matched-pack">(${transaction.matched})</span>` : ''}
            </span>
            <span class="transaction-price">$${transaction.price}</span>
        `;
        transactionList.appendChild(div);
    });

    // Display total
    totalElement.innerHTML = `
        <span>Total spent:</span>
        <span>$${data.total}</span>
    `;

    // Update POE2 Beta tracker
    updatePOE2Tracker(data.total);

    // Display not found items if any
    if (data.notFound.length > 0) {
        notFoundElement.className = 'not-found';
        notFoundElement.innerHTML = `
            <h3>Items not found in price database:</h3>
            <div>${data.notFound.join('<br>')}</div>
        `;
    }
}