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
        const submitTransactionButton = team.querySelector('.submit-transaction');

        let money = parseInt(localStorage.getItem(`team${teamId}-money`)) || 1000;
        let carbonCredits = parseInt(localStorage.getItem(`team${teamId}-carbonCredits`)) || 10;
        let carbonEfficiency = parseFloat(localStorage.getItem(`team${teamId}-carbonEfficiency`)) || 1.0;

        moneyElement.textContent = money;
        carbonCreditsElement.textContent = carbonCredits;
        carbonEfficiencyElement.textContent = carbonEfficiency.toFixed(1);

        const addClickEffect = (button) => {
            button.addEventListener('click', () => {
                button.classList.add('clicked');
                setTimeout(() => {
                    button.classList.remove('clicked');
                }, 150);
            });
        };

        const produceButton = team.querySelector('.produce');
        const improveEfficiencyButton = team.querySelector('.improve-efficiency');
        const buyCarbonCreditsButton = team.querySelector('.buy-carbon-credits');
        const sellCarbonCreditsButton = team.querySelector('.sell-carbon-credits');

        addClickEffect(produceButton);
        addClickEffect(improveEfficiencyButton);
        addClickEffect(buyCarbonCreditsButton);
        addClickEffect(sellCarbonCreditsButton);

        produceButton.addEventListener('click', () => {
            if (carbonCredits >= 1 * carbonEfficiency) {
                carbonCredits -= 1 * carbonEfficiency;
                money += 1000;
                updateTeamData(teamId, money, carbonCredits, carbonEfficiency);
                nextTeam();
            } else {
                alert("온실가스 배출권이 부족해요!");
            }
        });

        improveEfficiencyButton.addEventListener('click', () => {
            if (money >= 500) {
                money -= 500;
                carbonEfficiency = Math.max(0.1, carbonEfficiency - 0.1);
                updateTeamData(teamId, money, carbonCredits, carbonEfficiency);
                nextTeam();
            } else {
                alert("돈이 부족해요!");
            }
        });

        buyCarbonCreditsButton.addEventListener('click', () => {
            toggleTransactionForm(transactionForm, submitTransactionButton, 'buy');
        });

        sellCarbonCreditsButton.addEventListener('click', () => {
            toggleTransactionForm(transactionForm, submitTransactionButton, 'sell');
        });

        submitTransactionButton.addEventListener('click', () => {
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
                        alert("돈이 부족해요!");
                    }
                } else if (action === 'sell') {
                    if (carbonCredits >= amount) {
                        money += amount * price;
                        carbonCredits -= amount;
                        updateTeamData(teamId, money, carbonCredits, carbonEfficiency);
                    } else {
                        alert("온실가스 배출권이 부족해요!");
                    }
                }
                transactionForm.style.display = 'none';
            } else {
                alert("다시 입력하세요");
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

    function toggleTransactionForm(form, submitButton, action) {
        if (form.style.display === 'none' || form.style.display === '') {
            hideAllForms();
            form.style.display = 'block';
            form.dataset.action = action;
            submitButton.textContent = action === 'buy' ? '구매' : '판매';
        } else {
            form.style.display = 'none';
        }
    }

    function hideAllForms() {
        const forms = document.querySelectorAll('.transaction-form');
        forms.forEach(form => form.style.display = 'none');
    }

    function updateTeamButtonsVisibility() {
        hideAllForms(); // 모든 폼 숨기기
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
});