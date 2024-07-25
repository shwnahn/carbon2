document.addEventListener('DOMContentLoaded', () => {
    const teams = document.querySelectorAll('.team');
    const turnNumberElement = document.getElementById('turn-number');

    let currentTurn = parseInt(localStorage.getItem('currentTurn')) || 1;
    let currentTeamIndex = parseInt(localStorage.getItem('currentTeamIndex')) || 0;

    turnNumberElement.textContent = currentTurn;
    updateTeamButtonsVisibility();

    teams.forEach((team, index) => {
        const teamId = team.dataset.team;
        const moneyElement = team.querySelector('.money');
        const carbonCreditsElement = team.querySelector('.carbon-credits');
        const carbonEfficiencyElement = team.querySelector('.carbon-efficiency');
        const transactionForm = team.querySelector('.transaction-form');

        let money = parseInt(localStorage.getItem(`team${teamId}-money`)) || 1000;
        let carbonCredits = parseInt(localStorage.getItem(`team${teamId}-carbonCredits`)) || 10;
        let carbonEfficiency = parseFloat(localStorage.getItem(`team${teamId}-carbonEfficiency`)) || 1.0;

        moneyElement.textContent = money;
        carbonCreditsElement.textContent = carbonCredits;
        carbonEfficiencyElement.textContent = carbonEfficiency.toFixed(1);

        team.querySelector('.produce').addEventListener('click', () => {
            if (carbonCredits >= 1 * carbonEfficiency) {
                carbonCredits -= 1 * carbonEfficiency;
                money += 1000;
                updateTeamData(teamId, money, carbonCredits, carbonEfficiency);
                nextTeam();
            } else {
                alert("Not enough carbon credits to produce!");
            }
        });

        team.querySelector('.improve-efficiency').addEventListener('click', () => {
            if (money >= 500) {
                money -= 500;
                carbonEfficiency = Math.max(0.1, carbonEfficiency - 0.1);
                updateTeamData(teamId, money, carbonCredits, carbonEfficiency);
                nextTeam();
            } else {
                alert("Not enough money to improve efficiency!");
            }
        });

        team.querySelector('.buy-carbon-credits').addEventListener('click', () => {
            transactionForm.style.display = 'block';
            transactionForm.dataset.action = 'buy';
        });

        team.querySelector('.sell-carbon-credits').addEventListener('click', () => {
            transactionForm.style.display = 'block';
            transactionForm.dataset.action = 'sell';
        });

        team.querySelector('.submit-transaction').addEventListener('click', () => {
            const amount = parseInt(team.querySelector('.carbon-credits-amount').value);
            const price = parseInt(team.querySelector('.carbon-credits-price').value);
            const action = transactionForm.dataset.action;

            if (!isNaN(amount) && !isNaN(price) && amount > 0 && price > 0) {
                if (action === 'buy') {
                    const totalCost = amount * price;
                    if (money >= totalCost) {
                        money -= totalCost;
                        carbonCredits += amount;
                        updateTeamData(teamId, money, carbonCredits, carbonEfficiency);
                        nextTeam();
                    } else {
                        alert("Not enough money to buy carbon credits!");
                    }
                } else if (action === 'sell') {
                    if (carbonCredits >= amount) {
                        money += amount * price;
                        carbonCredits -= amount;
                        updateTeamData(teamId, money, carbonCredits, carbonEfficiency);
                    } else {
                        alert("Not enough carbon credits to sell!");
                    }
                }
                transactionForm.style.display = 'none';
            } else {
                alert("Please enter valid numbers for both amount and price.");
            }
        });

        function updateTeamData(teamId, money, carbonCredits, carbonEfficiency) {
            localStorage.setItem(`team${teamId}-money`, money);
            localStorage.setItem(`team${teamId}-carbonCredits`, carbonCredits);
            localStorage.setItem(`team${teamId}-carbonEfficiency`, carbonEfficiency);

            moneyElement.textContent = money;
            carbonCreditsElement.textContent = carbonCredits;
            carbonEfficiencyElement.textContent = carbonEfficiency.toFixed(1);
        }
    });

    function updateTeamButtonsVisibility() {
        teams.forEach((team, index) => {
            const buttons = team.querySelectorAll('.action-button');
            buttons.forEach(button => button.style.display = index === currentTeamIndex ? 'inline-block' : 'none');
            
            if (index === currentTeamIndex) {
                team.classList.add('active');
            } else {
                team.classList.remove('active');
            }
        });
    }

    function nextTeam() {
        currentTeamIndex++;
        if (currentTeamIndex >= teams.length) {
            currentTeamIndex = 0;
            currentTurn++;
            turnNumberElement.textContent = currentTurn;
            localStorage.setItem('currentTurn', currentTurn);
        }
        localStorage.setItem('currentTeamIndex', currentTeamIndex);
        updateTeamButtonsVisibility();
    }
})