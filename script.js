document.addEventListener('DOMContentLoaded', () => {
    function formatNumber(num) {
        if (num === undefined || num === null) {
            return '0';
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function showModal(message) {
        modalMessage.textContent = message;
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    const teams = document.querySelectorAll('.team');
    const turnNumberElement = document.getElementById('turn-number');
    const creditPriceElement = document.getElementById('credit-price');
    const eventSection = document.getElementById('event-section');
    const eventButtons = document.querySelectorAll('.event-button');
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    const closeButton = document.querySelector('.close-button');
    const gameStatus = document.querySelector('.game_status');
    const skipButton = document.getElementById('skip-button'); // 추가된 부분

    closeButton.addEventListener('click', closeModal);
    skipButton.addEventListener('click', skipTurnOrEvent); // 추가된 부분

    let currentTurn = parseInt(localStorage.getItem('currentTurn')) || 1;
    let currentTeamIndex = parseInt(localStorage.getItem('currentTeamIndex')) || 0;
    let creditPrice = parseInt(localStorage.getItem('creditPrice')) || 50000;
    let lastEvent = localStorage.getItem('lastEvent') || 'None';
    let lastEventId = parseInt(localStorage.getItem('lastEventId')) || 0;
    let efficiencyCosts = JSON.parse(localStorage.getItem('efficiencyCosts')) || [50000, 100000, 200000]; // 초기 배출효율 높이기 가격

    turnNumberElement.textContent = currentTurn;
    creditPriceElement.textContent = formatNumber(creditPrice);
    updateTeamButtonsVisibility();
    updateLastEventStatus();

    // 이벤트 버튼 상태 복원 및 클릭 이벤트 추가
    eventButtons.forEach(button => {
        const eventId = button.dataset.event;
        const eventClicked = localStorage.getItem(`eventClicked${eventId}`) === 'true';
        if (eventClicked) {
            button.disabled = true;
        }
        button.addEventListener('click', () => {
            handleEvent(parseInt(eventId));
            button.disabled = true;  // 버튼 비활성화
            localStorage.setItem(`eventClicked${eventId}`, 'true'); // 이벤트 클릭 상태 저장
            eventSection.style.display = 'none';
            eventSection.classList.remove('active'); // 이벤트 섹션 비활성화
            nextTurn();  // 다음 턴으로 이동
        });
    });

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
        let efficiencyCost = parseInt(localStorage.getItem(`team${teamId}-efficiencyCost`)) || efficiencyCosts[carbonEfficiency - 1];

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
                updateTeamData(teamId, money, carbonCredits, carbonEfficiency, productPrice, efficiencyCost);
                nextTeam();
            } else {
                showModal("온실가스 배출권이 부족해요!");
            }
        });

        improveEfficiencyButton.addEventListener('click', () => {
            if (money >= efficiencyCost && carbonEfficiency > 1) {
                money -= efficiencyCost;
                carbonEfficiency -= 1;
                efficiencyCost = efficiencyCosts[carbonEfficiency - 1] || 0;
                updateTeamData(teamId, money, carbonCredits, carbonEfficiency, productPrice, efficiencyCost);
                nextTeam();
            } else {
                if (carbonEfficiency <= 1) {
                    showModal("탄소 배출효율을 더 이상 높일 수 없습니다!");
                } else {
                    showModal(`돈이 부족해요! (필요한 돈: ${formatNumber(efficiencyCost)}원)`);
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
                    const totalCost = amount * price;
                    const teamMoney = parseInt(localStorage.getItem(`team${team.dataset.team}-money`)) || 100000;
                    if (teamMoney >= totalCost && amount <= 10) {
                        let money = teamMoney - totalCost;
                        carbonCredits += amount;
                        updateTeamData(team.dataset.team, money, carbonCredits, carbonEfficiency, productPrice, efficiencyCost);
                        nextTeam();
                    } else {
                        if (amount > 10) {
                            showModal("한 번에 최대 10장만 구매할 수 있습니다!");
                        } else {
                            showModal("돈이 부족해요!");
                        }
                    }
                } else if (action === 'sell') {
                    if (carbonCredits >= amount) {
                        let money = parseInt(localStorage.getItem(`team${team.dataset.team}-money`)) || 100000;
                        money += amount * price;
                        carbonCredits -= amount;
                        updateTeamData(team.dataset.team, money, carbonCredits, carbonEfficiency, productPrice, efficiencyCost);
                    } else {
                        showModal("온실가스 배출권이 부족해요!");
                    }
                }
                transactionForm.style.display = 'none';
            } else {
                showModal("유효한 숫자를 입력하세요!");
            }
        });

        function updateTeamData(teamId, money, carbonCredits, carbonEfficiency, productPrice, efficiencyCost) {
            localStorage.setItem(`team${teamId}-money`, money);
            localStorage.setItem(`team${teamId}-carbonCredits`, carbonCredits);
            localStorage.setItem(`team${teamId}-carbonEfficiency`, carbonEfficiency);
            localStorage.setItem(`team${teamId}-productPrice`, productPrice);
            localStorage.setItem(`team${teamId}-efficiencyCost`, efficiencyCost);

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
            eventSection.style.display = 'block';
            eventSection.classList.add('active');
        }
        localStorage.setItem('currentTeamIndex', currentTeamIndex);
        updateTeamButtonsVisibility();
    }
    // nextTurn 함수 수정
    function nextTurn() {
        currentTeamIndex = 0;
        currentTurn++;
        turnNumberElement.textContent = currentTurn;
        localStorage.setItem('currentTurn', currentTurn);
        localStorage.setItem('currentTeamIndex', currentTeamIndex);
        
        // 이전 이벤트의 영향을 해제하는 로직
        removeLastEventEffect();
        
        updateTeamButtonsVisibility();
        eventSection.style.display = 'none'; // 이벤트 선택 섹션 비활성화
    }
    
    function handleEvent(eventId) {
        lastEventId = eventId; // 이벤트 ID 저장
        teams.forEach((team) => {
            const teamId = team.dataset.team;
            const moneyElement = team.querySelector('.money');
            const carbonCreditsElement = team.querySelector('.carbon-credits');
            const carbonEfficiencyElement = team.querySelector('.carbon-efficiency');
            const productPriceElement = team.querySelector('.product-price');
    
            let money = parseInt(localStorage.getItem(`team${teamId}-money`)) || 100000;
            let carbonCredits = parseInt(localStorage.getItem(`team${teamId}-carbonCredits`)) || 10;
            let carbonEfficiency = parseInt(localStorage.getItem(`team${teamId}-carbonEfficiency`)) || 4;
            let productPrice = parseInt(localStorage.getItem(`team${teamId}-productPrice`)) || 200000;
    
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
    
            switch(eventId) {
                case 1:
                    creditPrice *= 2;
                    localStorage.setItem('creditPrice', creditPrice);
                    creditPriceElement.textContent = formatNumber(creditPrice);
                    lastEvent = "정부에서 배출권 과잉공급을 통제하기 시작했습니다. 가격이 2배가 됩니다.";
                    showModal(lastEvent);
                    break;
                case 2:
                    localStorage.setItem('eventEffect', 'efficiencyCostHalved');
                    lastEvent = "한 턴 동안 배출효율 높이기의 가격이 50% 저렴해집니다.";
                    showModal(lastEvent);
                    break;
                case 3:
                    teams.forEach((team, index) => {
                        let money = parseInt(localStorage.getItem(`team${team.dataset.team}-money`)) || 100000;
                        let carbonCredits = parseInt(localStorage.getItem(`team${team.dataset.team}-carbonCredits`)) || 10;
                        if (money >= 50000) {
                            money -= 50000;
                        } else {
                            let deficit = 50000 - money;
                            money = 0;
                            carbonCredits -= Math.ceil(deficit / creditPrice);
                        }
                        updateTeamData(team.dataset.team, money, carbonCredits, parseInt(localStorage.getItem(`team${team.dataset.team}-carbonEfficiency`)) || 4, parseInt(localStorage.getItem(`team${team.dataset.team}-productPrice`)) || 200000);
                    });
                    lastEvent = "경제 불황으로 인해 기업들의 재정상태가 악화되었습니다. 모든 팀의 자산이 50,000원씩 감소합니다. 낼 돈이 부족하면 탄소배출권 5장을 빼앗습니다.";
                    showModal(lastEvent);
                    break;
                case 4:
                    teams.forEach((team, index) => {
                        let carbonEfficiency = parseInt(localStorage.getItem(`team${team.dataset.team}-carbonEfficiency`)) || 4;
                        if (carbonEfficiency < 2) {
                            let money = parseInt(localStorage.getItem(`team${team.dataset.team}-money`)) || 100000;
                            money += 100000;
                            updateTeamData(team.dataset.team, money, parseInt(localStorage.getItem(`team${team.dataset.team}-carbonCredits`)) || 10, carbonEfficiency, parseInt(localStorage.getItem(`team${team.dataset.team}-productPrice`)) || 200000);
                        }
                    });
                    lastEvent = "정부가 친환경 사업을 진행하는 기업에게 보조금을 줍니다. 배출효율을 2번 이상 높인 팀이 100,000원을 받습니다.";
                    showModal(lastEvent);
                    break;
                case 5:
                    teams.forEach((team, index) => {
                        let productPrice = 300000; // 경기 호황 시 300,000원으로 증가
                        updateTeamData(team.dataset.team, parseInt(localStorage.getItem(`team${team.dataset.team}-money`)) || 100000, parseInt(localStorage.getItem(`team${team.dataset.team}-carbonCredits`)) || 10, parseInt(localStorage.getItem(`team${team.dataset.team}-carbonEfficiency`)) || 4, productPrice);
                    });
                    lastEvent = "경기 호황입니다! 다음 한 턴 동안, 제품 생산 시 얻는 돈이 200,000원에서 300,000원이 됩니다.";
                    showModal(lastEvent);
                    break;
                case 6:
                    lastEvent = "대규모 자연재해가 발생하여 생산 시설이 파괴되었습니다. 모든 기업은 다음 턴 동안 제품을 생산할 수 없습니다.";
                    showModal(lastEvent);
                    teams.forEach((team) => {
                        const produceButton = team.querySelector('.produce');
                        produceButton.disabled = true;
                    });
                    break;
                case 7:
                    let minMoney = Math.min(...Array.from(teams).map(team => parseInt(team.querySelector('.money').textContent.replace(/,/g, ''))));
                    teams.forEach((team) => {
                        let money = parseInt(team.querySelector('.money').textContent.replace(/,/g, ''));
                        if (money === minMoney) {
                            money += 100000;
                            updateTeamData(team.dataset.team, money, parseInt(localStorage.getItem(`team${team.dataset.team}-carbonCredits`)) || 10, parseInt(localStorage.getItem(`team${team.dataset.team}-carbonEfficiency`)) || 4, parseInt(localStorage.getItem(`team${team.dataset.team}-productPrice`)) || 200000);
                        }
                    });
                    lastEvent = "태풍피해로 인하여 제품을 생산하지 못한 기업에게 재난지원금이 지원되었습니다. 가장 돈이 적은 플레이어에게 자금 + 100,000원";
                    showModal(lastEvent);
                    break;
                default:
                    break;
            }
            localStorage.setItem('lastEvent', lastEvent);
            localStorage.setItem('lastEventId', eventId);
            updateLastEventStatus();
        });
    }
    
    function updateLastEventStatus() {
        const lastEventElement = document.getElementById('last-event');
        if (lastEventElement) {
            lastEventElement.textContent = `지난 이벤트: ${lastEvent}`;
        } else {
            const lastEventDiv = document.createElement('div');
            lastEventDiv.id = 'last-event';
            lastEventDiv.textContent = `지난 이벤트: ${lastEvent}`;
            gameStatus.appendChild(lastEventDiv);
        }
    }

    // 이전 이벤트의 영향을 해제하는 함수
    function removeLastEventEffect() {
        switch (lastEventId) {
            case 2:
                localStorage.setItem('eventEffect', '');
                break;
            case 5:
                teams.forEach((team) => {
                    let productPrice = 200000; // 경기 호황 해제 시 200,000원으로 복구
                    updateTeamData(team.dataset.team, parseInt(localStorage.getItem(`team${team.dataset.team}-money`)) || 100000, parseInt(localStorage.getItem(`team${team.dataset.team}-carbonCredits`)) || 10, parseInt(localStorage.getItem(`team${team.dataset.team}-carbonEfficiency`)) || 4, productPrice);
                });
                break;
            case 6:
                teams.forEach((team) => {
                    const produceButton = team.querySelector('.produce');
                    produceButton.disabled = false; // 자연재해 해제 시 생산 버튼 활성화
                });
                break;
            // 다른 이벤트의 영향을 해제하는 로직 추가
        }
    }
    skipButton.addEventListener('click', skipTurnOrEvent);

    function skipTurnOrEvent() {
        if (eventSection.classList.contains('active')) {
            // 이벤트 선택을 건너뛰기
            eventSection.style.display = 'none';
            eventSection.classList.remove('active');
            nextTurn();
        } else {
            // 현재 팀의 턴을 건너뛰기
            nextTeam();
        }
    }
});


