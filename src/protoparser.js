// protoparser.js, copyright (c) 2018-2020, 2022 Alexey Galkin, licensed under the MIT license.
// version 8

// Системные значения по-умолчанию

// окончания для краткой формы причастий
const PARTICIPLE_SUFFIX = {m: '', f: 'а', n: 'о', p: 'ы'}

// окончания существительных по родам
const GEND_SUFFIX = {
	m: /[^аьяоеыи]/,
	f: /[аья]/,
	n: /[ое]/,
	p: /[ыи]/
}

// посещенные локации и находящиеся в них объекты, которые были осмотрены
var visitedLocs = {}

// параметры команд
var gameCommands = {
	examine: ['examine', ['осмотреться', 'осмотреть', 'изучить', 'смотреть', 'см', 'исследовать', 'рассмотреть', 'о', 'осм'], -1],
	north: ['walk', ['север', 'с'], 0, 'n'],
	south: ['walk', ['юг', 'ю'], 0, 's'],
	west: ['walk', ['запад', 'з'], 0, 'w'],
	east: ['walk', ['восток', 'в'], 0, 'e'],
	up: ['walk', ['вверх', 'вв', 'наверх', 'подняться'], 0, 'u'],
	down: ['walk', ['вниз', 'вн', 'спуститься', 'опуститься'], 0, 'd'],
	northEast: ['walk', ['северо-восток', 'с-в', 'св'], 0, 'ne'],
	northWest: ['walk', ['северо-запад', 'с-з', 'сз'], 0, 'nw'],
	southEast: ['walk', ['юго-восток', 'ю-в', 'юв'], 0, 'se'],
	southWest: ['walk', ['юго-запад', 'ю-з', 'юз'], 0,'sw'],
	inventory: ['inventory', ['инвентарь', 'инв', 'и'], 0],
	take: ['take', ['взять', 'поднять', 'забрать', 'подобрать'], 1],
	drop: ['drop', ['бросить', 'выбросить', 'положить', 'оставить', 'выкинуть'], 1],
	wait: ['wait', ['ждать', 'подождать', 'ж'], 0],
	read: ['read', ['читать', 'прочитать'], 1],
	eat: ['eat', ['съесть', 'есть', 'кушать', 'скушать'], 1],
	wear: ['wear', ['надеть'], 1],
	disrobe: ['disrobe', ['снять'], 1],
	open: ['open', ['открыть'], 1],
	close: ['close', ['закрыть'], 1],
	unlock: ['unlock', ['отпереть'], 1],
	lock: ['lock', ['запереть'], 1],
	jump: ['jump', ['прыгать', 'прыгнуть', 'подпрыгнуть'], 0],
	attack: ['attack', ['ударить', 'пнуть', 'стукнуть', 'атаковать'], 1],
	sleep: ['sleep', ['спать', 'поспать', 'заснуть'], 0],
	say: ['say', ['сказать', 'произнести', 'ответить', 'спросить', 'говорить'], 2, 'noun'],
	listen: ['listen', ['слушать', 'подслушать', 'послушать'], -1],
	smell: ['smell', ['нюхать', 'понюхать'], -1],
	sing: ['sing', ['петь', 'спеть', 'запеть'], 0],
	show: ['show', ['показать', 'продемонстрировать', 'демонстрировать'], 1],
	buy: ['buy', ['купить', 'приобрести'], 1],
	sell: ['sell', ['продать', 'сбыть'], 1],
	screw: ['screw', ['завинтить', 'закрутить', 'вкрутить', 'ввинтить', 'прикрутить'], 1],
	unscrew: ['unscrew', ['открутить', 'выкрутить', 'вывинтить'], 1],
	think: ['think', ['думать', 'подумать', 'размышлять', 'задуматься'], 0],
	wake: ['wake', ['проснуться', 'пробудиться'], 0],
	jumpOver: ['jumpOver', ['перепрыгнуть'], 1],
	kiss: ['kiss', ['поцеловать', 'целовать', 'расцеловать'], 1],
	rub: ['rub', ['тереть', 'протереть', 'натереть', 'начистить', 'потереть'], 1],
	cut: ['cut', ['резать', 'разрезать', 'перерезать', 'отрезать', 'срезать', 'обрезать', 'пилить', 'отпилить', 'перепилить', 'рубить', 'срубить', 'отрубить', 'отсечь'], 1],
	tie: ['tie', ['привязать', 'завязать', 'связать'], 1],
	untie: ['untie', ['развязать', 'отвязать'], 1],
	burn: ['burn', ['зажечь', 'поджечь', 'сжечь', 'жечь'], 1],
	bow: ['bow', ['поклониться', 'кланяться'], -1],
	clearScreen: ['clearScreen', ['очистка'], 0, 'sysCom'],
	score: ['score', ['счет', 'счёт', 'сч', 'очки', 'ход', 'ходы'], 0, 'sysCom'],
	restart: ['restart', ['заново', 'сначала'], 0, 'sysCom'],
	about: ['about', ['версия'], 0, 'sysCom'],
	saveGame: ['saveGame', ['сохранить'], 2, 'sysCom'],
	loadGame: ['loadGame', ['загрузить', 'восстановить'], 2, 'sysCom'],
	advice: ['advice', ['совет', 'подсказка', 'спойлер'], 0, 'sysCom'],
	help: ['help', ['помощь', 'справка', '?'], 0, 'sysCom'],
	history: ['history', ['история'], 0, 'sysCom'],
	repeat: ['repeat', ['п', 'повтор', 'повторить'], 0, 'sysCom'],
	log: ['log', ['лог', 'транскрипт'], 0, 'sysCom'],
	places: ['places', ['места', 'локации', 'комнаты'], 0, 'sysCom']
}

var defSysVal = {
	longCommandMsg: 'Команда должна состоять не более чем из двух слов.',
	emptyCommandMsg: 'Простите?',
	unknownCommandMsg: 'Команда непонятна.',
	noScoreMsg: 'В этой игре не ведется счет.',
	overburdenMsg: 'Вы несете слишком много вещей.',
	confirmRestartMsg: 'Вы действительно хотите начать игру заново?',
	cancelRestartMsg: 'Команда отменена.',
	savedMsg: 'Игра сохранена.',
	notSavedMsg: 'Ошибка сохранения.',
	loadedMsg: 'Игра загружена.',
	notLoadedMsg: 'Ошибка загрузки.',
	noThingMsg: 'Здесь нет этого предмета.',
	winMsg: '<p style="font-weight: bold; text-align: center;">*** Вы победили! ***</p>',
	lostMsg: '<p style="font-weight: bold; text-align: center;">*** Вы проиграли! ***</p>',
    downloadLogMsg: 'Скачать лог игры',
	saveForbiddenMsg: 'В этой игре сохранение запрещено.',
	loadForbiddenMsg: 'В этой игре восстановление запрещено.',
	noWayMsg: 'В этом направлении нельзя пойти.',
	placedHereMsg: ' Здесь есть ',
	playerHasNothingMsg: 'У вас с собой ничего нет.',
	playerHasMsg: 'У вас с собой: ',
	commandHistoryIsEmptyMsg: 'История команд пуста.',
	commandHistoryOffMsg: 'В этой игре не ведется история команд.',
	advice: 'В этой игре не предусмотрено подсказок.',
	help: 'Для ввода команд используйте шаблон ГЛАГОЛ [СУЩЕСТВИТЕЛЬНОЕ]. Регистр и лишние пробелы не учитываются. Команда должна состоять не более чем из двух слов. Полный список стандартных команд, поддерживаемых протопарсером, указан в Руководстве автора, в Приложении 1.<br><br><b>Системные команды:</b><br><ul><li><em>Сохранить &#91имя&#93</em> – сохраняет текущее состояние игры под заданным именем;</li><li><em>Загрузить &#91имя&#93</em> – загружает сохраненное состояние игры с заданным именем;</li><li><em>Заново</em> – перезапускает игру;</li><li><em>Повторить (Numpad +)</em> – выполняет последнюю команду, сохраненную в истории команд;</li><li><em>История (Alt + H)</em> – выводит список команд, сохраненных в истории команд;</li><li><em>Счет (Numpad *)</em> – выводит текущий счет и количество сделанных ходов с начала игры;</li><li><em>Версия (Alt + V)</em> – выводит информацию о версии protoparser.js и лицензиях;</li><li><em>Очистка (Alt + C)</em> – удаляет с экрана лог игры;</li><li><em>Совет (Alt + A)</em> – выводит советы по игре (если автор их написал);</li><li><em>Стрелка вверх</em> – добавляет команду из истории команд в строку ввода: от последней к более ранним;</li><li><em>Стрелка вниз</em> – добавляет команду из истории команд в строку ввода: от самой первой к более поздним;</li><li><em>Лог (Alt + J)</em> – выводит ссылку для скачивания лога;</li><li><em>Локации (Alt + M)</em> – выводит список посещенных локаций и находившихся в них объектов, которые были осмотрены;</li><li><em>Справка (Alt + ?)</em> – выводит краткую справочную информацию по управлению игрой.</li></ul>',
	about: 'protoparser.js<br>Версия: 8<br>protoparser.js is copyright (c) 2018-2020, 2022 Alexey Galkin, released under the MIT license.',
	think: 'Вы все время думаете.',
	wake: 'Это не сон.',
	kiss: 'Вы сдерживаете свой порыв.',
	noVisitedMsg: 'Вы пока не посетили ни одной локации.',
	wait: 'Проходит немного времени.',
	jump: 'Вы подпрыгиваете.',
	sleep: 'Сейчас не время для сна.',
	listen: 'Вы не слышите ничего необычного.',
	smell: 'Вы не чувствуете ничего необычного.',
	sing: 'Вы запеваете подходящую случаю песню.',
	points: 0,
	turn: 0,
	commandTemplate: '',
	prompt: '> ',
    comment: '.',
	commandHistoryLength: 10,
	commandHistoryIndex: -1,
	num7Key: 'северо-запад',
	num8Key: 'север',
	num9Key: 'северо-восток',
	num4Key: 'запад',
	num5Key: 'осмотреться',
	num6Key: 'восток',
	num1Key: 'юго-запад',
	num2Key: 'юг',
	num3Key: 'юго-восток',
	num0Key: 'вниз',
	numDecimalPointKey: 'вверх',
	numDivideKey: 'инвентарь',
	numMultiplyKey: 'счет',
	numAddKey: 'повторить',
	altSlashKey: 'помощь',
	altVKey: 'версия',
	altHKey: 'история',
	altAKey: 'совет',
	altJKey: 'лог',
	altMKey: 'локации',
    altCKey: 'очистка'
}

keyBindings = {
    altKey: {
        86: 'altVKey',
        72: 'altHKey',
        65: 'altAKey',
        74: 'altJKey',
        77: 'altMKey',
        191: 'altSlashKey',
        67: 'altCKey'
    },
    103: 'num7Key',
    104: 'num8Key',
    105: 'num9Key',
    100: 'num4Key',
    101: 'num5Key',
    102: 'num6Key',
    97: 'num1Key',
    98: 'num2Key',
    99: 'num3Key',
    96: 'num0Key',
    110: 'numDecimalPointKey',
    111: 'numDivideKey',
    106: 'numMultiplyKey',
    107: 'numAddKey'
}

// Если автор не переопределил системные сообщения определяем их
for (property in defSysVal)
	if (!game.hasOwnProperty(property)) game[property] = defSysVal[property]

class Terminal {
  print(text) {
    var line = document.createElement('div');
    line.innerHTML = '\n<p>' + text + '</p>\n'; // добавляем переносы \n для форматирования лога
    document.getElementById('output').appendChild(line);
  }
}

var t = new Terminal();

// Старт игры
init();

// События клавиатуры
function keyBoardEvents(e) {
    if (game.stopped) return;
    // История команд (стрелки вверх-вниз)
    if (e.which === 38 || e.which === 40) {
		e.preventDefault()
            e.which === 38 ? game.commandHistoryIndex++ : game.commandHistoryIndex--
            if (game.commandHistory[game.commandHistoryIndex] === undefined) {
                if (e.which === 38) game.commandHistoryIndex = 0
                if (e.which === 40) game.commandHistoryIndex = game.commandHistory.length - 1
            }
            if (game.commandHistory[0] === undefined) {
                document.getElementById('input').value = ''
                t.print(game.prompt + 'история')
                history()
            } 
            else document.getElementById('input').value = game.commandHistory[game.commandHistoryIndex]
    }
    
    // Горячие клавиши
    if (e.which in keyBindings || e.altKey && e.which in keyBindings.altKey) {
    
        e.preventDefault()
        game.commandHistoryIndex = -1

        // Нажата Alt
        if (e.altKey)
            var hotKeyCommand = game[keyBindings.altKey[e.which]]
        // Не нажата Alt
        else
            var hotKeyCommand = game[keyBindings[e.which]]
        
        var line = document.createElement('div');
        line.innerHTML = '\n<p><span class="userCommand">' + game.prompt + hotKeyCommand + '</span></p>'; // добавляем \n для форматирования лога
        document.getElementById('output').appendChild(line);
        document.getElementById('output').lastChild.scrollIntoView();
        document.getElementById('form').reset();
        
        output(hotKeyCommand);
    }       
}

// Функция ввода/вывода
function inp() {

    document.getElementById('form').addEventListener('submit', function(event) {
        event.preventDefault();
        if (game.stopped) return;
        
        input = document.getElementById('input').value;
        
        var line = document.createElement('div');
        line.innerHTML = '\n<p><span class="userCommand">' + game.prompt + input + '</span></p>'; // добавляем \n для форматирования лога
        document.getElementById('output').appendChild(line);
        document.getElementById('form').reset();
        document.getElementById('output').lastChild.scrollIntoView();
        
        output(input);
        
        return false;
    });
}

// Парсер
// Определяет функцию, которая обработает команду пользователя, и возвращает результат, полученный от этой функции

function parser(input) {
    
	// переводим буквы в прописные и обрезаем game.prompt
	input = input.toLowerCase();
	// удаляем боковые пробелы и делим строку по пробелу на глагол и существительное
	var words = input.trim().split(/\s+/);
    // если введен комментарий — прекращаем обработку
    if (words[0] == game.comment) return;
	// введено больше 2 слов
	if (words.length > 2) return t.print(game.longCommandMsg)
	// пользователь ввел пустую строку
	if (words == '') return t.print(game.emptyCommandMsg)
	var verb = words[0];
	var noun = words[1];
	// ищем команду по введенному глаголу и вызываем соответствующую функцию
	for (var com in gameCommands)
		if (gameCommands[com][1].indexOf(verb) != -1) return choiceHandler(gameCommands[com][0], gameCommands[com][2], noun, verb, gameCommands[com][3] == 'noun' ? noun : gameCommands[com][3] == 'verb' ? verb: gameCommands[com][3])
	// глагол не найден
	t.print(game.unknownCommandMsg)
}

// Вывод 
function output(input) { 
	parser(input);
    document.getElementById('prompt').innerHTML = game.prompt;
    document.getElementById('input').value = game.commandTemplate
}

// СТАНДАРТНЫЕ ГЛАГОЛЫ

// Осмотреть
function examine(obj) {
	var roomDesc;
	// введена команда <осмотреть>
	if (obj === undefined) {
		// массив предметов в комнате
		var objInRoom = getObjByKV('loc', player.loc);
		// массив предметов со свойством sceneDesc и без свойства hidden: true
		var objWithSceneDesc = objInRoom.filter(function(obj) {
			return obj.sceneDesc && !obj.hidden
		})
		// массив предметов (obj не связана с examine(obj)) без свойства sceneDesc и без hidden: true
		var nonHiddenObj = objInRoom.filter(function(obj) {
			return !obj.hidden && !obj.sceneDesc
		})
		// строка, содержащая значения свойства sceneDesc объектов из массива objWithSceneDesc
		var objDesc = ''
		// добавляем значения свойства sceneDesc объектов objWithSceneDesc к objDesc
		for (var i in objWithSceneDesc)
			objDesc += ' ' + objWithSceneDesc[i].sceneDesc
		// строка содержащая game.placedHereMsg + названия объектов 
		var objNames = '<br><br>' + game.placedHereMsg;
		// добавляем названия объектов к objNames
		for (var i in nonHiddenObj) { 
			objNames += nonHiddenObj[i].nam[0];
			// добавляем знаки препинания
			if (i == nonHiddenObj.length - 2) objNames += ' и '
            else if (i < nonHiddenObj.length - 1) objNames += ', '
            else objNames += '.'
			}
		// если все предметы в комнате со свойством hidden: true "обнуляем" objNames
		if (nonHiddenObj.length == 0) objNames = ''
	// Выводим полное описание локации
	t.print(window[player.loc].desc + objDesc + objNames)

	// введена команда <осмотреть [предмет]>
	} else {
		// если у предмета нет examined устанавливаем его равным 1, иначе увеличиваем на 1
		(!obj.examined) ? obj.examined = 1 : obj.examined++
		t.print(obj.desc)
	}
}

// Инвентарь
function inventory() {
	var inv = getObjByKV('loc', 'player');
	// если inv содержит объект со свойством hiddenPossession == true, исключаем его из него
	inv = inv.filter(function(item) {return !item.hiddenPossession})
		
	if (inv.length == 0) {
		t.print(game.playerHasNothingMsg)
	} else {
		var invObj = game.playerHasMsg;
		for (var i = 0; i < inv.length; i++) {
			invObj += inv[i].nam[0];
			// если предмет из инвентаря надет добавляем эту информацию
			if (inv[i].worn) invObj += ' (надет' + PARTICIPLE_SUFFIX[inv[i].gend] + ')';
			// добавляем знаки препинания
			if (i == inv.length - 2) invObj += ' и '
            else if (i < inv. length - 1) invObj += ', '
            else invObj += '.' 
		}
		t.print(invObj)
	}
}

// Взять
function take(obj) {
	// объект можно взять
	if (obj.takeable) {
		// объекта нет в инвентаре
		if (obj.loc.indexOf('player') == -1) {
			//если move == true
			move(obj, 'player') && t.print('Вы забираете ' + obj.nam[3] + '.')
		// объект уже в инвентаре
		} else {
			t.print(capitalize(obj.nam[0]) + ' уже у вас.')
		// takeable объекта не равно true
		}} else {
			t.print('Вы не можете взять ' + obj.nam[3] + '.')
	}
}

// Бросить
function drop(obj) {
	// объекта нет в локации
	if (obj.loc.indexOf(player.loc) == -1) {
		// объект у игрока
		if (obj.loc == 'player') {
		// если объект надет снимаем его
		if (obj.worn) disrobe(obj)
			move(obj,player.loc);
			t.print('Вы оставляете здесь ' + obj.nam[3] + '.')
	}} else {
		t.print(capitalize(obj.nam[0]) + ' уже здесь.')
	}
}

// Движение
// параметр obj нужен, чтобы получить второй аргумент direction
function walk(obj, direction) {
	// проверяем, есть ли у текущей локации свойство-выход direction
	if (direction in window[player.loc]) {
		// если между комнатами есть дверь обрабатываем
		// шаблон pattern: в строке (loc) есть 'текущая локация и локация назначения'	
		var pattern = new RegExp('(?=.*' + player.loc + ')' + '(?=.*' + window[player.loc][direction] + ')')
		// из массива объектов со свойством door: true получаем отфильтрованный массив door в котором значение loc равно pattern
		var door = getObjByKV('door', true).filter(function(o) {
			if (pattern.test(o.loc)) return true
		})
		// если на пути есть дверь и она закрыта выводим сообщение 
		if (door[0] && door[0].closed) return t.print('Путь прегражден ' + door[0].nam[4] + '.')
		// путь свободен
		move(player, window[player.loc][direction]);
	} else {
		t.print(game.noWayMsg)
	}
}

// Читать
function read(obj) {
	// у объекта есть свойство text
	if (obj.text) t.print(obj.text)
	else t.print('На ' + obj.nam[5] + ' ничего не написано.')
}

// Съесть
function eat(obj) {
	// если свойство edible == true
	if (obj.edible) {
		remove(obj);
		t.print('Вы съедаете ' + obj.nam[3] + '.')
	// свойство edible != true
	} else t.print(capitalize(obj.nam[3]) + ' нельзя употребить в пищу.')
}

// Надеть
function wear(obj) {
	// объект можно надеть
	if (obj.hasOwnProperty('worn')) {
		// объект не надет
		if (!obj.worn) {
			// если объект не в инвентаре, забираем его
			if (obj.loc != 'player') take(obj)
			// если объект в инвентаре одеваем его
			if (obj.loc == 'player') {
			obj.worn = true;
			t.print('Вы надеваете ' + obj.nam[3] + '.')
			}
		//объект уже надет
		} else t.print(capitalize(obj.nam[0]) + ' уже надет' + PARTICIPLE_SUFFIX[obj.gend] + '.')
	// объект нельзя надеть
	} else t.print(capitalize(obj.nam[3]) + ' нельзя надеть.')
}

// Снять
function disrobe(obj) {
	// если объект надет
	if (obj.worn) {
		obj.worn = false;
		obj.loc = 'player';
		t.print('Вы снимаете ' + obj.nam[3] + '.')
	// если объект не надет
	} else t.print('На вас нет ' + obj.nam[1] +'.')
}

// Открыть
function open(obj) {
	// если есть свойство closed
	if (obj.hasOwnProperty('closed')) {
		// если объект закрыт
		if (obj.closed) {
			// если объект не заперт
			if (!obj.locked) {
				obj.closed = false;
				t.print('Вы открываете ' + obj.nam[3] + '.')
			} 
			// если объект заперт
			else t.print(capitalize(obj.nam[0]) + ' заперт' + PARTICIPLE_SUFFIX[obj.gend] + '.')
		// если объект открыт
		} else t.print(capitalize(obj.nam[0]) + ' уже открыт' + PARTICIPLE_SUFFIX[obj.gend] + '.')
	// если нет свойства closed
	} else t.print(capitalize(obj.nam[3]) + ' невозможно открыть.')
}

// Закрыть
function close(obj) {
	// если есть свойство closed
	if (obj.hasOwnProperty('closed')) {
		// если объект открыт
		if (!obj.closed) {
			obj.closed = true;
			t.print('Вы закрываете ' + obj.nam[3] + '.')
		// если объект закрыт
		} else t.print(capitalize(obj.nam[0]) + ' уже закрыт' + PARTICIPLE_SUFFIX[obj.gend] + '.')
	// если нет свойства closed
	} else t.print(capitalize(obj.nam[3]) + ' невозможно закрыть.')
}

// Отпереть
function unlock(obj) {
	// объект не заперается
	if (!obj.hasOwnProperty('locked')) t.print(capitalize(obj.nam[3]) + ' невозможно отпереть.')
	// объект может запираться
	// объект не закрыт
	else if (!obj.closed) t.print(capitalize(obj.nam[0]) + ' уже открыт' + PARTICIPLE_SUFFIX[obj.gend] + '.')
	// объект закрыт
	else {
		// объект заперт
		if (obj.locked) {
			obj.locked = false;
			t.print('Вы отпираете ' + obj.nam[3] + '.')
			// объект не заперт
		} else
			t.print(capitalize(obj.nam[0]) + ' не заперт' + PARTICIPLE_SUFFIX[obj.gend] + '.')
	}
}

// Запереть
function lock(obj) {
	// объект не заперается
	if (!obj.hasOwnProperty('locked')) t.print(capitalize(obj.nam[3]) + ' невозможно запереть.')
	// объект может запираться
	// объект не закрыт
	else if (!obj.closed) t.print(capitalize(obj.nam[0]) + ' не закрыт' + PARTICIPLE_SUFFIX[obj.gend] + '.')
	// объект закрыт
	else {
		// объект не заперт
		if (!obj.locked) {
			obj.locked = true;
			t.print('Вы запираете ' + obj.nam[3] + '.')
			// объект заперт
		} else
			t.print(capitalize(obj.nam[0]) + ' уже заперт' + PARTICIPLE_SUFFIX[obj.gend] + '.')
	}
}

// Атаковать
function attack(obj, option, verb) {
	t.print('Не стоит пытаться ' + verb + ' ' + obj.nam[3] + '.')
}

// Сказать
function say(obj, citation) {
	t.print('Вы говорите: \«' + capitalize(citation) + '\».')
}

// Показать
function show(obj) {
	if (obj.loc == 'player')
	t.print('Вы показываете ' + obj.nam[3] + '.')
	else t.print('Вы показываете на ' + obj.nam[3] + '.')
}

// Купить
function buy(obj, option, verb) {
	t.print('Вы не можете ' + verb + ' ' + obj.nam[3] + '.')
}

// Продать
function sell(obj, option, verb) {
	t.print('Вы не можете ' + verb + ' ' + obj.nam[3] + '.')
}

// Закрутить
function screw(obj, option, verb) {
	t.print('Не стоит пытаться ' + verb + ' ' + obj.nam[3] + '.')
}

// Открутить
function unscrew(obj) {
	t.print(capitalize(obj.nam[0]) + ' ни к чему не прикручен' + PARTICIPLE_SUFFIX[obj.gend] + '.')
}

// Перепрыгнуть
function jumpOver(obj, option, verb) {
	t.print('Не стоит пытаться ' + verb + ' ' + obj.nam[3] + '.')
}

// Тереть
function rub(obj, option, verb) {
	t.print('Не стоит пытаться ' + verb + ' ' + obj.nam[3] + '.')
}

// Отрезать
function cut(obj, option, verb) {
	t.print('Не стоит пытаться ' + verb + ' ' + obj.nam[3] + '.')
}

// Привязать
function tie(obj, option, verb) {
	t.print('Не стоит пытаться ' + verb + ' ' + obj.nam[3] + '.')
}

// Развязать
function untie(obj) {
	t.print(capitalize(obj.nam[0]) + ' ни к чему не привязан' + PARTICIPLE_SUFFIX[obj.gend] + '.')
}

// Зажечь
function burn(obj, option, verb) {
	t.print('Не стоит пытаться ' + verb + ' ' + obj.nam[3] + '.')
}

// Поклониться
function bow(obj) {
	t.print('Вы кланяетесь' + (obj ? ' ' + obj.nam[2] : '') + '.')
}

// СЛУЖЕБНЫЕ ГЛАГОЛЫ

// Очистить экран
function clearScreen() {
    var clearedElements = document.getElementById('output').children
    for(i = 0; i < clearedElements.length; i++) {
        clearedElements[i].style.display = 'none';
    }
    t.print('');
}

// Счет
function score() {
	if (game.noScore) t.print(game.noScoreMsg)
	else if (!game.maxScore) t.print('К ' + game.turn + ' ходу ваш счет равен ' + game.points + '.')
	else t.print('К ' + game.turn + ' ходу ваш счет равен ' + game.points + ' из ' + game.maxScore + '.')
}

// Перемещение объекта
function move(obj, loc) {
	// перемещение предмета в инвентарь
	if (loc == 'player' && obj.spec == 'thing') {
	// число вещей в инвентаре максимально
		if (getObjByKV('loc', 'player').length == player.maxCarried) {
			t.print(game.overburdenMsg);
			return false
		}
	}
	obj.loc = loc
	obj.moved ? obj.moved++ : obj.moved = 1
	// перемещение игрока в локацию
	if (obj === player && window[loc].spec == 'room') {
		// если у  комнаты нет visits устанавливаем его равным 1, иначе увеличиваем на 1
		(!window[loc].visits) ? window[loc].visits = 1 : window[loc].visits++
		window[loc].head && t.print('<br><b>' + window[loc].head + '</b>')
		examine()
	}
	return true
}

// Заново
function restart() {
    var confirmed = confirm(game.confirmRestartMsg);
		if (confirmed)
            window.location.reload(true)
		else
			t.print(game.cancelRestartMsg)
} 

// Сохранить игру
function saveGame(obj, optional, verb, fileName) {
	if (!game.noSaveLoad) save(fileName) ? t.print(game.savedMsg) : t.print(game.notSavedMsg)
	else t.print(game.saveForbiddenMsg)
}

// Загрузить игру
function loadGame(obj, optional, verb, fileName) {
	if (!game.noSaveLoad) {
    if (load(fileName)) {
      t.print(game.loadedMsg)
      window[player.loc].head && t.print('<br><b>'+window[player.loc].head+'</b>')
      examine()
    } else
      t.print(game.notLoadedMsg)
  } else
    t.print(game.loadForbiddenMsg)
}

// Повторить
function repeat() {
	if (game.commandHistory[0])
	output(game.commandHistory[0])
	else history()
}

// История
function history() {
	if (game.commandHistory[0]) {
		for (var i = game.commandHistory.length - 1; i > -1; i--)
			t.print(game.commandHistory.length - i + '. ' + game.commandHistory[i])
	} else {
		game.commandHistoryLength == 0 ? t.print(game.commandHistoryOffMsg) : t.print(game.commandHistoryIsEmptyMsg)
	}
}

// Лог
function log () {
    // Добавляем ссылку на скачивание лога
    let blob = new Blob([document.getElementById('output').textContent], {type: 'text/plain'});
    link = window.URL.createObjectURL(blob);
    t.print(`<a download="${game.title}.txt" href="${link}" id="link"> ${game.downloadLogMsg}</a>`)
}

// Вариант с копированием лога в буфер обмена
/* async function log() {
    try {
        await navigator.clipboard.writeText(document.getElementById('output').textContent);
        t.print(game.logCopiedMsg);
    } catch (e) {
        t.print(game.logErrorMsg, e);
    }
} */

// Места
function places() {
	// есть ли посещенные локации (локации с head в объекте visitedLocs)
	if (Object.keys(visitedLocs) != '') {
		t.print('Вы посетили:')
		var n = 0
		for (var loc in visitedLocs) {
			t.print(++n + '. ' + window[loc].head)
			if (visitedLocs[loc] != '') t.print('Вы осмотрели: ' + visitedLocs[loc].join(', ') + '.')
		}
	} else t.print(game.noVisitedMsg)
}

// УТИЛИТЫ

// Удаляем объект 
//Присваиваем переменной которой изначально был присвоен объект (в файле story.js) пустое значение локации и падежным формам. Ссылка на объект остается в аргументе obj, поэтому он все еще доступен в обрабатывающей функции
function remove(obj) {	
	for (o in window) {
		if (window[o] && window[o].nam === obj.nam) {
			window[o].loc = '';
            window[o].nam = ['', '', '', '', '', ''];
			break
		}
	}
}

// Изменение счета
function reward(scores) {
	if (!game.noScore) {
		if (typeof scores == 'number') {
			scores > 0 && t.print('Ваш счет увеличился на ' + scores + '.')
			scores < 0 && t.print('Ваш счет уменьшился на ' + Math.abs(scores) + '.')
			game.points += scores
			score()
		}
	}
}

// Сохранение
function save(fileName) {
	if (window.localStorage) {
		for (var objName in window) {
			if (window[objName] && window[objName].spec) {
				localStorage.setItem(objName + '___' + fileName + '___' + game.title, JSON.stringify(window[objName]))
			}
		}
		return true
	}
}

// Загрузка
function load(fileName) {
	// проверяем наличие доступа к localStorage
	if (window.localStorage) {
		var n = 0;
		// перебираем объекты в localStorage
		for (var locObj in localStorage) {
			// если в localStorage есть искомый ключ  
			if (locObj.indexOf('___' + fileName + '___' + game.title) !== -1) {
				// преобразуем его в объект
				var obj = JSON.parse(localStorage.getItem(locObj))
				// перебираем свойства нашего объекта
				for (localProperty in obj) {
					// добавляем существующему объекту в window свойства из сохраненного объекта (obj). Если бы мы заменили существующий объект на сохраненный, то потеряли бы методы, поскольку они не сериализуются => не попадают в localStorage 
					window[locObj.slice(0, locObj.indexOf('___'))][localProperty] = obj[localProperty]
				}
				n++
			}
		}
		// в localStorage найдены искомые объекты  
		if (n != 0) return true // игра загружена
	}
}

// Окончание игры
function end(mode) {
	mode == 1 && t.print(game.winMsg)
	mode == 0 && t.print(game.lostMsg)
	!game.noScore && score()
	game.stopped = true
    document.getElementById('input').disabled = true;
    
    log();
}

// Функция вывода текста (сокращенный вариант для автора)
function p(message) {
	t.print(message)
}

// Перевод первого символа в строке в верхний регистр
function capitalize(str) {
	return str[0].toUpperCase() + str.substring(1)
}

// Определение рода объекта
function gendDef() {
	if (!this.gend) {
		var lastChar = this.nam[0].slice(-1)
		for (var prop in GEND_SUFFIX) {
			if (GEND_SUFFIX[prop].test(lastChar))
			{
				this.gend = prop
				break
			}
		}
	}
}

// Получаем массив объектов по свойству и значению
function getObjByKV(key,value) {
	var objArray = [];
	for (var objName in window) {
		// для элементов массива (например, свойства nam) делаем нечувствительный к регистру поиск. Для случаев, если элемент(ы) начинаются с заглавных букв, а пользователь вводит строчные
		if (window[objName] && (( window[objName][key] instanceof Array && window[objName][key].join(' ').match(new RegExp(value, 'i'))) || (window[objName][key] == value)))		objArray.push(window[objName])
	}
	return objArray
}

// Можно ли взаимодействовать с предметом
function isNounValid(noun) {
	// (если предмет введен пользователем и есть в игре) и (либо в текущей локации, либо в инвентаре), то возвращаем true
	if ((noun !== undefined && getObjByKV('nam', noun).length > 0) && (getObjByKV('nam', noun)[0].loc.indexOf(player.loc) != -1 || getObjByKV('nam', noun)[0].loc.indexOf('player') != -1)) return true	
}

/* Выбираем обработчик команды: глобальный, локальный или стандартный
Параметры:
* com - имя функции- обработчика команды
* comMode - 'режим команды': -1 - существительное (объект) опционально, 0 - только глагол, 1 - существительное (объект) обязательно, 2 существительное (объект или произвольная строка) обязательно
* noun - введенное существительное
* verb введенный глагол
* optional передает доп. параметр (направление, в команде walk)
*/
function choiceHandler(com, comMode, noun, verb, optional) {
	// Существительное не введено
	if (comMode > 0 && noun == undefined) return t.print('Что вы хотите ' + verb + '?')
	// Ожидается только глагол, но дополнительно введено существительное	
	if (comMode == 0 && noun != undefined) return t.print('Понятна только команда \«' + verb + '\».')

	var handled = false // по-умолчанию, команда не обработана
	
	// если noun доступен присваиваем его obj для передачи в качестве аргумента функции-обработчику
	if (isNounValid(noun)) var obj = getObjByKV('nam', noun)[0];	

	// если предмета нет или он доступен или comMode == 2
	if (noun === undefined || isNounValid(noun) || comMode == 2) {
			// увеличиваем счетчик ходов, если не была вызвана системная команда
			optional != 'sysCom' && game.turn++
			// добавляем команду в историю команд (кроме команды 'повторить', 'история' или если команда уже в истории команд)
			(game.commandHistory.indexOf(noun ? verb + ' ' + noun : verb) == -1 && com != 'repeat' && com != 'history') && game.commandHistory.unshift(noun ? verb + ' ' + noun : verb)
			if (game.commandHistory.length > game.commandHistoryLength) game.commandHistory.pop()
			// если у локации есть свойство head добавляем локацию и осмотренные в ней предметы в объект visitedLocs
			if (window[player.loc].head) visitedLocs[player.loc] = getObjByKV('spec', 'thing').filter(function(thing) {return thing.examined && thing.loc.indexOf(player.loc) != -1}).map(function(obj){return obj.nam[3]})
			// если метод beforeAll присутствует - вызываем его
		if (typeof events.beforeAll === 'function') handled = events.beforeAll(com, obj, optional, verb, noun)
		// команда не обработана
		if (!handled) {
			// если comMode != 2 и команда состоит из глагола и существительного и есть локальный обработчик в предмете 
			if (comMode != 2 && noun !== undefined && com in getObjByKV('nam', noun)[0]) handled = getObjByKV('nam', noun)[0][com](obj, optional, verb, noun);
			// если есть обработчик в локации
			else if (com in window[player.loc]) handled = window[player.loc][com](obj, optional, verb, noun)
			// если есть объект globalVerbs и  глобальный обработчик в нем, выполняем его
			else if (window.globalVerbs && com in globalVerbs) handled = globalVerbs[com](obj, optional, verb, noun)
			// если пользовательских обработчиков нет или команда не обработана до конца (!handled): если в объекте game есть свойство с именем вызываемой функции выводим значение свойства, иначе вызываем стандартный обработчик команды 
			if (!handled) game[com] ? t.print(game[com]) : window[com](obj, optional, verb, noun) 
		}
		// если метод afterAll присутствует вызываем его
		if (typeof events.afterAll === 'function') events.afterAll(com, obj, optional, verb, noun);
	} else
		t.print(game.noThingMsg)
}

// Инициализация переменных и старт игры
function init() {
	clearScreen();
	// Выводим информацию об игре и вступление
	game.title && t.print('<span style="font-weight: bold;">' + game.title + '</span>');
	game.author && t.print('Автор: ' +  game.author);
	game.version && t.print('Версия: ' + game.version);
	game.year && t.print('Год: ' + game.year);
	game.license && t.print('Лицензия: ' + game.license);
  if (game.ifid) {
    t.print('IFID: ' + game.ifid)
    t.print('<!-- UUID://' + game.ifid + '// -->')
  }
	game.ageRating && t.print('Возрастные ограничения: ' + game.ageRating);
	game.info && t.print('<br><span style="font-style: italic;">' + game.info + '</span>');
	t.print('<br>')
    
    // Выводим приглашение при запуске
    document.getElementById('prompt').innerHTML = game.prompt;
    
	// устанавливаем служебные переменные
	game.stopped = false // остановка вызова inp()

	// Инициализируем массив истории команд
	game.commandHistory = []

	// Для корректного сохранения и загрузки добавляем стандартным объектам свойство spec
	player.spec = 'player'
	game.spec = 'game'
	// Если автор не создал объекты events и globalVerbs создаем их
	if (!window.events) window['events'] = {}
	if (!window.globalVerbs) window['globalVerbs'] = {}
	events.spec = 'events'
	globalVerbs.spec = 'globalVerbs'
	
	var things = getObjByKV('spec', 'thing')
	// определяем свойство gend для объектов у которых оно не определено
	for (var i in things)
		gendDef.call(things[i])
	gendDef.call(player)

	// Сохраняем начальное состояние игры
	save('initialState')

	// Устанавливаем в качестве заголовка окна название игры
	document.getElementsByTagName('title')[0].textContent = game.title
	
	// Если у объекта events есть метод init вызываем его
	if (typeof events.init === 'function') events.init()
	// «перемещаем» игрока в стартовую локацию для вывода ее описания
	move(player, player.loc)
	player.moved--

	// Запускаем тесты, если они включены в настройках игры
	if (game.tests) tests();
    
    // Опрос клавиатуры для перехвата горячих клавиш
    document.addEventListener('keydown', keyBoardEvents);
    
    // Подтверждение на закрытие окна с игрой
    addEventListener('beforeunload', (event) => {
        event.preventDefault();
    });
    
    document.getElementById('input').value = game.commandTemplate
    
	// Ввод/вывод
	inp();
}

// Тесты
function tests() {
	commands.forEach(function(command, i) {
		t.print('<br>Тест # ' + (i + 1) + ': ' + game.prompt + command);
		output(command)
	})
	t.print('<br> ТЕСТИРОВАНИЕ ЗАВЕРШЕНО.')
}
