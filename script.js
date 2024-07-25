document.addEventListener('DOMContentLoaded', () => {
    // 숫자를 쉼표로 구분하여 표시하는 함수
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    const teams = document.querySelectorAll('.team');
    const turnNumberElement = document.getElementById('turn-number');
    const creditPriceElement = document.getElementById('credit-price');

    let currentTurn = parseInt(localStorage.getItem('currentTurn')) || 1;
    let currentTeamIndex = parseInt(localStorage.getItem('currentTeamIndex')) || 0;
    let creditPrice = parseInt(localStorage.getItem('creditPrice')) || 50000;

    turnNumberElement.textContent = currentTurn;
    creditPriceElement.textContent = formatNumber(creditPrice);
    updateTeamButtonsVisibility();

    teams.forEach((team, index) => {
        const teamId = team.dataset.team;
        const moneyElement = team.querySelector('.money');
        const carbonCreditsElement = team.querySelector('.carbon-credits');
        const carbonEfficiencyElement = team.querySelector('.carbon-efficiency');
        const productPriceElement = team.querySelector('.product-price');
        const transactionForm = team.querySelector('.transaction-form');
        const submitTransactionButton = team.querySelector('.submit-transaction');

        let money = parseInt(localStorage.getItem(`team${teamId}-money`)) || 100000;
        let carbonCredits = parseInt(localStorage.getItem(`team${teamId}-carbonCredits`)) || 10;
        let carbonEfficiency = parseInt(localStorage.getItem(`team${teamId}-carbonEfficiency`)) || 4;
        let productPrice = parseInt(localStorage.getItem(`team${teamId}-productPrice`)) || 200000;

        moneyElement.textContent = formatNumber(money);
        carbonCreditsElement.textContent = carbonCredits;
        carbonEfficiencyElement.textContent = carbonEfficiency;
        productPriceElement.textContent = formatNumber(productPrice);

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
            if (carbonCredits >= carbonEfficiency) {
                carbonCredits -= carbonEfficiency;
                money += productPrice;
                updateTeamData(teamId, money, carbonCredits, carbonEfficiency, productPrice);
                nextTeam();
            } else {
                alert("온실가스 배출권이 부족해요!");
            }
        });

        improveEfficiencyButton.addEventListener('click', () => {
            let cost = 0;
            if (carbonEfficiency == 4) {
                cost = 50000;
            } else if (carbonEfficiency == 3) {
                cost = 100000;
            } else if (carbonEfficiency == 2) {
                cost = 200000;
            }

            if (money >= cost && carbonEfficiency > 1) {
                money -= cost;
                carbonEfficiency -= 1;
                updateTeamData(teamId, money, carbonCredits, carbonEfficiency, productPrice);
                nextTeam();
            } else {
                if (carbonEfficiency <= 1) {
                    alert("탄소 배출효율을 더 이상 높일 수 없습니다!");
                } else {
                    alert(`돈이 부족해요! (필요한 돈: ${formatNumber(cost)}원)`);
                }
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
                    const totalCost = amount * creditPrice; // 정부에서의 탄소배출권 가격
                    if (money >= totalCost && amount <= 10) {
                        money -= totalCost;
                        carbonCredits += amount;
                        updateTeamData(teamId, money, carbonCredits, carbonEfficiency, productPrice);
                        nextTeam();
                    } else {
                        if (amount > 10) {
                            alert("한 번에 최대 10장만 구매할 수 있습니다!");
                        } else {
                            alert("돈이 부족해요!");
                        }
                    }
                } else if (action === 'sell') {
                    if (carbonCredits >= amount) {
                        money += amount * price;
                        carbonCredits -= amount;
                        updateTeamData(teamId, money, carbonCredits, carbonEfficiency, productPrice);
                    } else {
                        alert("온실가스 배출권이 부족해요!");
                    }
                }
                transactionForm.style.display = 'none';
            } else {
                alert("유효한 숫자를 입력하세요!");
            }
        });

        function updateTeamData(teamId, money, carbonCredits, carbonEfficiency, productPrice) {
            localStorage.setItem(`team${teamId}-money`, money);
            localStorage.setItem(`team${teamId}-carbonCredits`, carbonCredits);
            localStorage.setItem(`team${teamId}-carbonEfficiency`, carbonEfficiency);
            localStorage.setItem(`team${teamId}-productPrice`, productPrice);

            moneyElement.textContent = formatNumber(money);
            carbonCreditsElement.textContent = carbonCredits;
            carbonEfficiencyElement.textContent = carbonEfficiency;
            productPriceElement.textContent = formatNumber(productPrice);
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