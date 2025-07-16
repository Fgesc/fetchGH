window.addEventListener('DOMContentLoaded', () => {
    restoreRepoList();
    restoreCash();
});

function saveToLocalStorage(listItems) {
    localStorage.setItem('repos', JSON.stringify(listItems));
}

function saveCash(cashObj) {
    localStorage.setItem('cash', JSON.stringify(cashObj));
}

function restoreCash() {
    const savedCash = JSON.parse(localStorage.getItem('cash'));
    if (savedCash && typeof savedCash === 'object') {
        Object.assign(cash, savedCash);
    }
}

function restoreRepoList() {
    const savedRepos = JSON.parse(localStorage.getItem('repos'));
    if (savedRepos && savedRepos.length > 0) {
        savedRepos.forEach(item => {
            repoList.insertAdjacentHTML('beforeend', `<li class="repoList__item">
                <p class="dataRepo__item"> Name: ${item.name} </p>
                <p class="dataRepo__item owner"> Owner: ${item.owner} </p>
                <p class="dataRepo__item stars"> Stars: ${item.stars} </p>
                <button type="button" class="btn"> 
                    <img src="img/Vector 7.svg" class="btn-img1" width="42" height="38.5" alt="Крестик">
                    <img src="img/Vector 7.svg" class="btn-img2" width="42" height="38.5" alt="Крестик">
                </button>
            </li>`);
        });
    }
}

const wrapper = document.querySelector('.wrapper');
const inputBox = document.querySelector('input');
const suggBox= document.querySelector('.autocom-box');
const repoList= document.querySelector('.repoList');

let dataRepo = [];
const cash = {}; 

// Запрос к GitHub
async function requestGit(query) {
    try {
        let response = await fetch(`https://api.github.com/search/repositories?q=${query}`);
        let data =  await response.json();

        let res = data.items.filter((item) => {
            return item.name.startsWith(query);
        });
        return res || [];
    } catch (error) {
        console.error('Ошибка запроса', error);
        return [];
    }
}

// Обработка ввода
async function down(e) {
    try {
        let repoData = e.target.value.trim();

        if (repoData) {
            dataRepo = [];

            let result = await requestGit(repoData);

            while (suggBox.firstChild) {
                suggBox.removeChild(suggBox.firstChild);
            }

            if (result.length === 0){
                 suggBox.insertAdjacentHTML('beforeend', `<p class="autocom-box__item not-found">Ничего не найдено</p>`);
            }

            for(let i = 0; i < Math.min(result.length, 5); i++) {
                suggBox.insertAdjacentHTML('beforeend', `<li class="autocom-box__item" data-id="${i}" >${result[i].name}</li>`);
                dataRepo.push({'name': result[i].name, 'owner': result[i].owner.login, 'stars':result[i].stargazers_count});
            }
        } else {
            while (suggBox.firstChild) {
                suggBox.removeChild(suggBox.firstChild);
            }
        }
    } catch(e) {
        console.error('Введите корректное значение', e);
    }
}

// Дебаунс
const debounce = (fn, debounceTime) => {
    let timeOut;
    return function() {
        const fnCall = () => {fn.apply(this, arguments)};
        clearTimeout(timeOut);
        timeOut = setTimeout(fnCall, debounceTime)
    };
};

inputBox.addEventListener('keyup', debounce(down, 400));

// Обработка кликов
wrapper.addEventListener('click', (event) => {
    let target = event.target;

    // Клик по автокомплиту
    if (target.tagName.toLowerCase() === 'li' &&  target.closest('.autocom-box') !== null) {
        const { name, owner, stars } = dataRepo[target.dataset.id];
        let itemKey = `${name} ${owner} ${stars}`;

        if (cash[itemKey]) {
            console.log('Уже есть в списке');
            target.style.backgroundColor = 'green';
            return;
        }

        cash[itemKey] = true;
        saveCash(cash);

        inputBox.value = '';
        while (suggBox.firstChild) {
            suggBox.removeChild(suggBox.firstChild);
        }

        repoList.insertAdjacentHTML('beforeend', `<li class="repoList__item">
            <p class="dataRepo__item"> Name: ${name} </p>
            <p class="dataRepo__item owner"> Owner: ${owner} </p>
            <p class="dataRepo__item stars"> Stars: ${stars} </p>
            <button type="button" class="btn"> 
                <img src="img/Vector 7.svg" class="btn-img1" width="42" height="38.5" alt="Крестик">
                <img src="img/Vector 7.svg" class="btn-img2" width="42" height="38.5" alt="Крестик">
            </button>
        </li>`);

        const currentItems = JSON.parse(localStorage.getItem('repos')) || [];
        currentItems.push({ name, owner, stars });
        saveToLocalStorage(currentItems);
    }

    // Клик по крестику (удаление)
    if (target.tagName.toLowerCase() === 'img' && target.closest('.btn') !== null) {
        const parentLi = target.closest('.repoList__item');
        const nameToRemove = parentLi.querySelector('.dataRepo__item').textContent.replace('Name: ', '').trim();
        const ownerToRemove = parentLi.querySelector('.owner').textContent.replace('Owner: ', '').trim();
        const starsToRemove = parentLi.querySelector('.stars').textContent.replace('Stars: ', '').trim();

        const itemKey = `${nameToRemove} ${ownerToRemove} ${starsToRemove}`;
        delete cash[itemKey]; // удаляем из кэша
        saveCash(cash); // сохраняем кэш

        parentLi.remove();

        let currentItems = JSON.parse(localStorage.getItem('repos')) || [];
        currentItems = currentItems.filter(item => item.name !== nameToRemove || item.owner !== ownerToRemove || item.stars !== Number(starsToRemove));
        saveToLocalStorage(currentItems);
    }
});










