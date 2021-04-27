function Mine(tr, td, mineNum) {
    this.tr = tr; //行数
    this.td = td; //列数
    this.mineNum = mineNum; //雷的数量

    this.squares = []; //存储所有方块的信息，按行、列排放，二维数组
    this.tds = []; //存储所有单元格的dom对象

    this.surplusMine = mineNum; //剩余雷的数量
    this.allRight = false; //判断标记的是否全是雷

    this.parent = document.querySelector('.gameBox');
}

Mine.prototype.init = function () {
    const rn = this.randomNum(); //雷所在格子的索引
    let n = 0; //格子对应的索引

    for (let i = 0; i < this.tr; i++) {
        this.squares[i] = [];
        for (let j = 0; j < this.td; j++) {
            if (rn.indexOf(n) != -1) { //indexOf返回对应的索引，如果没找到对应的索引，返回-1
                //如果条件成立，说明这个索引对应的格子应该是雷
                this.squares[i][j] = {
                    type: 'mine',
                    x: j,
                    y: i
                }
            } else {
                this.squares[i][j] = {
                    type: 'number',
                    x: j,
                    y: i,
                    value: 0
                }
            }
            n++;
        }

    }

    //禁用右键菜单栏
    this.parent.oncontextmenu = function () {
        return false;
    }
    this.updateNum();
    this.createDom();

    this.mineNumDom = document.querySelector('.mineNum');
    this.mineNumDom.innerHTML = this.surplusMine;

}

Mine.prototype.randomNum = function () {
    const square = new Array(this.tr * this.td);
    for (let i = 0; i < square.length; i++) {
        square[i] = i;
    }
    square.sort(function () {
        return 0.5 - Math.random() //把所有格子顺序打乱
    })

    return square.slice(0, this.mineNum); //截取打乱后的前(雷数)个格子，相当于在棋盘上随机选择(雷数)个格子
}

//创建dom对象
Mine.prototype.createDom = function () {
    const This = this;
    const table = document.createElement('table');

    for (let i = 0; i < this.tr; i++) { //创建行
        const domTr = document.createElement('tr');
        this.tds[i] = [];

        for (let j = 0; j < this.td; j++) { //创建列
            const domTd = document.createElement('td');

            domTd.pos = [i, j]; //把格子对应的行与列存到格子身上，为了下面通过这个值去数组里取到对应的数据
            domTd.onmousedown = function () {
                This.play(event, this); //This指的是实例对象,this指的是点击的td
            }

            this.tds[i][j] = domTd;

            domTr.appendChild(domTd);
        }

        table.appendChild(domTr);
    }

    this.parent.innerHTML = '';
    this.parent.appendChild(table);
}

//找某个格子周围的所有非雷的格子
Mine.prototype.getAround = function (square) {
    const x = square.x;
    const y = square.y;
    const result = []; //找到的结果，以坐标形式储存

    //     x-1,y-1      x,y-1       x+1,y-1
    //     x-1,y        x,y         x+1,y
    //     x-1,y+1      x,y+1       x+1,y+1

    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i < 0 ||
                j < 0 ||
                i > this.td - 1 ||
                j > this.tr - 1 ||
                (i == x && j == y) ||
                this.squares[j][i].type == 'mine'
            ) {
                continue;
            }
            result.push([j, i]);
        }
    }
    return result;
}

//更新格子内显示的数字
Mine.prototype.updateNum = function () {
    for (let i = 0; i < this.tr; i++) {
        for (let j = 0; j < this.td; j++) {
            //只更新雷周围的数字
            const num = this.getAround(this.squares[i][j]);
            if (this.squares[i][j].type == 'mine') {
                for (let k = 0; k < num.length; k++) {
                    this.squares[num[k][0]][num[k][1]].value += 1;
                }
            }
        }
    }
}

Mine.prototype.play = function (ev, obj) {
    const This = this;
    if (ev.which == 1 && obj.className != 'flag') { //点击的是左键

        const curSquare = this.squares[obj.pos[0]][obj.pos[1]];
        const cl = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']

        if (curSquare.type == 'number') {
            obj.innerHTML = curSquare.value;
            obj.className = cl[curSquare.value];

            if (curSquare.value == 0) {
                /*
                    点到了数字0
                        显示自己
                        找周围
                            显示周围(如果周围的数字不为0，则停止) 
                            如果数字为0
                                显示自己
                                找周围                                
                */
                obj.innerHTML = '';

                function getAllZero(square) {
                    const around = This.getAround(square); //找到了周围
                    // around[0] = [0,1]
                    for (let i = 0; i < around.length; i++) {
                        const x = around[i][0];
                        const y = around[i][1];

                        This.tds[x][y].className = cl[This.squares[x][y].value];

                        if (This.squares[x][y].value == 0) {
                            if (!This.tds[x][y].check) {
                                This.tds[x][y].check = true;
                                getAllZero(This.squares[x][y]);
                            }
                        } else {
                            This.tds[x][y].innerHTML = This.squares[x][y].value;
                        }
                    }
                }

                getAllZero(curSquare);
            }


        } else {
            obj.className = 'mine';
            this.gameOver(obj);
        }
    }
    if (ev.which == 3) { //点击的是右键
        if (obj.className && obj.className != 'flag') {
            return;
        }
        obj.className = obj.className == 'flag' ? '' : 'flag'; //切换class

        //判断右键标的背后是否全是雷
        if (this.squares[obj.pos[0]][obj.pos[1]].type == 'mine') {
            this.allRight = true;
        } else {
            this.allRight = false;
        }

        //更新剩余雷数
        if (obj.className == 'flag') {
            this.mineNumDom.innerHTML = --this.surplusMine;
        } else {
            this.mineNumDom.innerHTML = ++this.surplusMine;
        }

        //标完雷之后判断是否游戏结束
        if (this.surplusMine == 0) {
            if (this.allRight) {
                alert('恭喜');
            } else {
                alert('游戏失败');
                this.gameOver();
            }
        }

    }

}

Mine.prototype.gameOver = function (curTd) {
    for (let i = 0; i < this.tr; i++) {
        for (let j = 0; j < this.td; j++) {
            if (this.squares[i][j].type == 'mine') {
                this.tds[i][j].className = 'mine';
            }
            this.tds[i][j].onmousedown = null;
        }
    }
    if (curTd) {
        curTd.style.backgroundColor = '#f00';
    }
}

const btns = document.querySelectorAll('.level button');
let ln = 0;
const arr = [
    [9, 9, 10],
    [16, 16, 40],
    [28, 28, 99]
];
let mine = null;

for (let i = 0; i < btns.length - 1; i++) {
    btns[i].onclick = function () {
        btns[ln].className = '';
        this.className = 'active';

        mine = new Mine(...arr[i]);
        mine.init();

        ln = i;
    }
}

btns[0].onclick();
btns[3].onclick = function(){
    mine.init();
}

// const mine = new Mine(10, 10, 10);
// mine.init();