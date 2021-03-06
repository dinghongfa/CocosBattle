const Player = require('Player');
window.Global = {
	hasStart: false,
	playAgain: false,
};

cc.Class({
	extends: cc.Component,

	properties: {
		far_bg: [cc.Node],
		far_speed: null,
		bulletPrefab: {
			default: null,
			type: cc.Prefab,
		},
		enemyPrefab: {
			default: null,
			type: cc.Prefab,
		},
		helicopterPrefab: {
			default: null,
			type: cc.Prefab,
		},
		bossPrefab: {
			default: null,
			type: cc.Prefab,
		},
		supplyPrefab: {
			default: null,
			type: cc.Prefab,
		},
		supBombPrefab: {
			default: null,
			type: cc.Prefab,
		},
		playerNode: {
			default: null,
			type: Player,
		},
		// 发射子弹的间隔 多少次update后
		bulletSpacing: null,
		// 敌人生成的间隔
		enemySpacing: null,
		// 直升机生成间隔
		helicopterSpacing: null,
		// boss生成间隔
		bossSpacing: null,
		// 清屏道具生成间隔
		supBombSpacing: 3,
		// 敌人数组
		enemyArray: {
			default: [],
			type: Array,
		},
		// 子弹数组
		bulletArray: {
			default: [],
			type: Array,
		},
		// 得分
		score: 0,
		scoreLabel: {
			default: null,
			type: cc.Label,
		},
		hasBoss: false,
		bulletPoolSize: 20,
		enemyPoolSize: 20,
		playAgainBtn: cc.Node,
		//开始游戏按钮
		startBtn: cc.Node,
		//游戏logo
		gameLogo: cc.Node,
		loadingNode: cc.Node,
		// 默认的子弹条数
		defaultBulletNum: 1,
		// 补给出现的间隔
		supplySpacing: 1500,
		supplyCount: 0,
		gotSupplyCount: 0,
		supBombCount: 0,
		timer: 0,
		// 子弹移动距离
		bulletDistance: 30,
		// 敌人移动距离
		enemyDistance: 3,
		// 直升机移动距离
		helicopterDistance: 2,
		// 清屏道具使用按钮
		bombBtn: {
			default: null,
			type: cc.Node,
		},
		// 清屏道具数量
		bombCount: null,
		bombLable: {
			default: null,
			type: cc.Label,
		},
	},

	// 碰撞组件tag
	// 0 player
	// 1 bullet
	// 2 enemy
	// 3 helicopter
	// 4 boss
	// 5 补给
	// 6 bomb 清屏道具

	bgMove(bgList, speed) {
		for (let index = 0; index < bgList.length; index++) {
			let element = bgList[index];
			element.y -= speed;
		}
	},

	checkBgReset(bgList) {
		let firstBg = bgList[0].getBoundingBox();
		let first_yMax = firstBg.yMax;
		let firstHeight = firstBg.height;
		if (first_yMax <= -firstHeight / 2) {
			let preFirst = bgList.shift();
			bgList.push(preFirst);
			let curFirstBg = bgList[0];
			preFirst.y = bgList[1].getBoundingBox().yMax + bgList[1].getBoundingBox().height / 2;
		}
	},

	initBulletPool() {
		this.bulletPool = new cc.NodePool();
		for (let i = 0; i < this.bulletPoolSize; i++) {
			let bullet = cc.instantiate(this.bulletPrefab); // 创建节点
			this.bulletPool.put(bullet); // 通过 putInPool 接口放入对象池
		}
	},

	// 获得补给后
	gotSupply() {
		if (this.bulletSpacing > 10) {
			this.bulletSpacing -= 2;
		}
		this.gotSupplyCount++;
	},

	// 获得清屏道具
	gotBomb() {
		this.bombCount++;
		this.setBomb();
	},

	createBulletCommon() {
		let bullet = null;
		if (this.bulletPool.size() > 0) { // 通过 size 接口判断对象池中是否有空闲的对象
			bullet = this.bulletPool.get();
		} else { // 如果没有空闲对象，也就是对象池中备用对象不够时，我们就用 cc.instantiate 重新创建
			bullet = cc.instantiate(this.bulletPrefab);
		}
		return bullet;
	},

	createBullet() {
		let bullet = this.createBulletCommon();
		this.node.addChild(bullet);
		// 设置子弹的初始位置
		bullet.setPosition(this.getBulletPos());
		bullet.getComponent('Bullet').init(this);
	},

	createBullet2() {
		let bullet1 = this.createBulletCommon();
		let bullet2 = this.createBulletCommon();
		this.node.addChild(bullet1);
		this.node.addChild(bullet2);
		// 设置子弹的初始位置
		let {
			x,
			y
		} = this.getBulletPosCommon();
		bullet1.setPosition(cc.p(x - 43, y + 40));
		bullet1.getComponent('Bullet').init(this);
		bullet2.setPosition(cc.p(x + 43, y + 40));
		bullet2.getComponent('Bullet').init(this);
	},

	createBullet3() {
		let bullet1 = this.createBulletCommon();
		let bullet2 = this.createBulletCommon();
		let bullet3 = this.createBulletCommon();
		this.node.addChild(bullet1);
		this.node.addChild(bullet2);
		this.node.addChild(bullet3);
		// 设置子弹的初始位置
		let {
			x,
			y
		} = this.getBulletPosCommon();
		bullet1.setPosition(cc.p(x - 43, y + 40));
		bullet1.getComponent('Bullet').init(this);
		bullet2.setPosition(cc.p(x + 43, y + 40));
		bullet2.getComponent('Bullet').init(this);
		bullet3.setPosition(cc.p(x, y + 100));
		bullet3.getComponent('Bullet').init(this);
	},

	// 子弹击中，或者超出边界后
	destroyBullet(bullet) {
		this.bulletPool.put(bullet);
	},

	initEnemyPool() {
		this.enemyPool = new cc.NodePool();
		for (let i = 0; i < this.enemyPoolSize; i++) {
			let enemy = cc.instantiate(this.enemyPrefab);
			this.enemyPool.put(enemy);
		}
	},

	initHelicopterPool() {
		this.helicopterPool = new cc.NodePool();
		for (let i = 0; i < 20; i++) {
			let helicopter = cc.instantiate(this.helicopterPrefab);
			this.helicopterPool.put(helicopter);
		}
	},

	initBossPool() {
		this.bossPool = new cc.NodePool();
		let boss = cc.instantiate(this.bossPrefab);
		this.bossPool.put(boss);
	},

	createHelicopter() {
		let helicopter = null;
		if (this.helicopterPool.size() > 0) { // 通过 size 接口判断对象池中是否有空闲的对象
			helicopter = this.helicopterPool.get();
		} else { // 如果没有空闲对象，也就是对象池中备用对象不够时，我们就用 cc.instantiate 重新创建
			helicopter = cc.instantiate(this.helicopterPrefab);
		}
		this.node.addChild(helicopter);
		let helicopterWidth = helicopter.width;
		let helicopterHeight = helicopter.height;
		// 设置子弹的初始位置
		helicopter.setPosition(this.getHelicopterPos(helicopterWidth, helicopterHeight));
		helicopter.getComponent('Helicopter').init(this);
	},

	createEnemy() {
		let enemy = null;
		if (this.enemyPool.size() > 0) { // 通过 size 接口判断对象池中是否有空闲的对象
			enemy = this.enemyPool.get();
		} else { // 如果没有空闲对象，也就是对象池中备用对象不够时，我们就用 cc.instantiate 重新创建
			enemy = cc.instantiate(this.enemyPrefab);
		}
		this.node.addChild(enemy);
		// 设置敌人的初始位置
		let enemyWidth = enemy.width;
		let enemyHeight = enemy.height;
		enemy.setPosition(this.getEnemyPos(enemyWidth, enemyHeight));
		enemy.getComponent('Enemy').init(this);
	},

	createBoss() {
		let boss = null;
		if (this.bossPool.size() > 0) {
			boss = this.bossPool.get();
		} else {
			boss = cc.instantiate(this.bossPrefab);
		}
		this.node.addChild(boss);
		let bossWidth = boss.width;
		let bossHeight = boss.height;
		boss.setPosition(this.getBossPos(bossWidth, bossHeight));
		boss.getComponent('Boss').init(this);
	},

	createSupply() {
		let supply = null;
		supply = cc.instantiate(this.supplyPrefab);
		this.node.addChild(supply);
		let supplyWidth = supply.width;
		let supplyHeight = supply.height;
		supply.setPosition(this.getSupplyPos(supplyWidth, supplyHeight));
		supply.getComponent('Supply').init(this);
	},

	createSupBomb() {
		let bomb = null;
		bomb = cc.instantiate(this.supBombPrefab);
		this.node.addChild(bomb);
		let bombWidth = bomb.width;
		let bombHeight = bomb.height;
		bomb.setPosition(this.getSupplyPos(bombWidth, bombHeight));
		bomb.getComponent('SupBomb').init(this);
	},

	destroyEnemy(enemy) {
		this.enemyPool.put(enemy);
	},

	destroyHelicopter(helicopter) {
		this.helicopterPool.put(helicopter);
	},

	getBulletPosCommon() {
		let {
			x,
			y,
		} = this.playerNode.node.getBoundingBox().center;
		let {
			height
		} = this.playerNode.node.getBoundingBox().height;
		return {
			x,
			y
		};
	},

	//获取子弹的初始位置，位于飞机的中间 头部位置
	getBulletPos() {
		let {
			x,
			y
		} = this.getBulletPosCommon();
		return cc.p(x, y + 100);
	},

	getEnemyPos(enemyWidth, enemyHeight) {
		// 随机生成敌人位置
		let {
			height
		} = this.node.getBoundingBox();
		//去掉敌人的宽度，使敌人不会只显示一半
		let w = this.node.width - enemyWidth;
		let randomX = -w / 2 + Math.random() * w;
		return cc.p(randomX, height / 2 + enemyHeight);
	},

	getHelicopterPos(helicopterwidth, helicopterHeight) {
		// 随机生成敌人位置
		let {
			height,
		} = this.node.getBoundingBox();
		//去掉敌人的宽度，使敌人不会只显示一半
		let w = this.node.width - helicopterwidth;
		let randomX = -w / 2 + Math.random() * w;
		return cc.p(randomX, height / 2 + helicopterHeight);
	},

	getSupplyPos(supplywidth, supplyHeight) {
		// 随机生成敌人位置
		let {
			height,
		} = this.node.getBoundingBox();
		//去掉敌人的宽度，使敌人不会只显示一半
		let w = this.node.width - supplywidth;
		let randomX = -w / 2 + Math.random() * w;
		return cc.p(randomX, height / 2 + supplyHeight);
	},

	getBossPos(helicopterwidth, helicopterHeight) {
		// 随机生成敌人位置
		let {
			height,
		} = this.node.getBoundingBox();
		//去掉敌人的宽度，使敌人不会只显示一半
		let w = this.node.width - helicopterwidth;
		let randomX = -w / 2 + Math.random() * w;
		return cc.p(0, height / 2 + helicopterHeight);
	},

	// 得分
	gainScore() {
		// 更新 scoreDisplay Label 的文字
		this.scoreLabel.string = 'Score: ' + this.score.toString();
	},

	onGameStart() {
		this.bombCount = 1;
		this.setBomb();
		let ani = this.loadingNode.getComponent(cc.Animation);
		ani.stop();
		this.loadingNode.active = false;
		this.gameState = true;
		this.bulletCount = 0;
		this.enemyCount = 0;
		this.helicopterCount = 0;
		this.bossCount = 0;
		this.score = 0;
		// this.score = 398;
		this.playerNode.node.active = true;
		this.startBtn.active = false;
		this.gameLogo.active = false;
	},

	playAgain() {
		Global.playAgain = true;
		cc.director.loadScene('game');
		// let self = this;
		// cc.director.loadScene('game', function() {
		//     Global.hasStart = true;
		// });
		// return;
		// this.onGameStart();
		// this.scoreLabel.string = 'Score: ' + this.score.toString();
		// this.playerNode.playAgain();
		// for (let i = 0; i < this.enemyArray.length; i++) {
		//     if (i < this.enemyPoolSize) {
		//         this.enemyPool.put(this.enemyArray[i]);
		//         continue;
		//     }
		//     this.enemyArray[i].destroy();
		// }
		// for (let j = 0; j < this.bulletArray.length; j++) {
		//     if (j < this.bulletPoolSize) {
		//         this.bulletPool.put(this.bulletArray[j]);
		//         continue;
		//     }
		//     this.bulletArray[i].destroy();
		// }
	},

	useBomb() {
		// console.log(cc.find('enemy', this.node));
		// console.log(this.node.getChildren());
		this.bombCount--;
		this.setBomb();
		let score = 0;
		let arr = this.node.getChildren();
		for (var i = 0; i < arr.length; i++) {
			let item = arr[i];
			switch (item.name) {
				case 'enemy':
					score += 1;
					item.destroy();
					break;
				case 'helicopter':
					score += 10;
					item.destroy();
					break;
				case 'boss':
					score += 100;
					item.destroy();
					break;
				default:
					break;
			}
		}
		this.score += score;
		this.gainScore();
	},

	gameOver() {
		this.gameState = false;
		this.playAgainBtn.active = true;
		this.bombCount = 0;
		this.setBomb();
	},

	// hasCollision() {
	//     let bullets = this.bulletArray;
	//     let enemys = this.enemyArray;
	//     for (let i = 0; i < enemys.length; i++) {
	//         for (let j = 0; j < bullets.length; j++) {
	//             // console.log(enemys[i].getBoundingBox(), bullets[j].getBoundingBox());
	//         }
	//     }
	// },

	setBomb() {
		this.bombLable.string = this.bombCount;
		if (this.bombCount == 0) {
			this.bombBtn.active = false;
			this.bombLable.node.active = false;
		} else {
			this.bombBtn.active = true;
			this.bombLable.node.active = true;
		}
	},

	initData() {
		this.bulletDistance = 30;
		this.enemyDistance = 3;
		this.helicopterDistance = 2;
	},

	// 设置清屏道具的位置 和 显示数量的位置
	setBombPos() {
		this.bombLable.node.setPosition(this.node.width / 2 - 100, -this.node.height / 4 - 220);
		this.bombBtn.setPosition(this.node.width / 2 - 100, -this.node.height / 4 - 150);
	},

	setZOrder() {
		this.scoreLabel.node.setLocalZOrder(9999);
		this.playerNode.node.setLocalZOrder(9999);
		this.bombBtn.setLocalZOrder(9999);
		this.playAgainBtn.setLocalZOrder(9999);
	},

	// LIFE-CYCLE CALLBACKS:

	onLoad() {
		// 间隔最小值
		// this.bulletSpacing = 10;
		// this.helicopterSpacing = 150;
		// this.enemySpacing = 30;
		// 设置各个常驻节点的层级，防止被遮盖
		this.setZOrder();
		this.bombCount = 0;
		this.setBomb();
		this.setBombPos();
		this.initData();
		this.gameLogo.active = false;
		this.startBtn.active = false;
		this.loadingNode.active = false;
		if (!Global.hasStart) {
			Global.hasStart = true;
			this.gameLogo.active = true;
			this.startBtn.active = true;
			this.loadingNode.active = true;
			let ani = this.loadingNode.getComponent(cc.Animation);
			let doani = ani.play('loading');
			doani.repeatCount = Infinity;
		}
		this.playAgainBtn.active = false;
		// 用于碰撞
		cc.director.getCollisionManager().enabled = true;
		// this.playerNode.init(this);
		this.playerNode.init(this);
		this.playerNode.node.setPosition(0, -this.node.height / 4);
		// cc.director.getCollisionManager().enabledDebugDraw = true;
		// cc.director.getCollisionManager().enabledDrawBoundingBox = true;
		let {
			width,
			height
		} = this.node.getBoundingBox();
		this.scoreLabel.node.setPosition(-this.node.width / 2 + 36, this.node.height / 2 - this.scoreLabel.node.height / 2 - 50);
		this.width = width;
		this.height = height;
		this.gameState = false;
		this.playerNode.node.active = false;
		this.initBulletPool();
		this.initEnemyPool();
		this.initHelicopterPool();
		this.initBossPool();
		if (Global.playAgain) {
			this.onGameStart();
		}
	},

	start() {

	},

	update(dt) {
		if (!this.gameState) {
			return;
		}
		//背景移动
		this.bgMove(this.far_bg, this.far_speed);
		this.checkBgReset(this.far_bg);
		// 碰撞检测
		// this.hasCollision();
		this.bulletCount++;
		if (this.bulletCount >= this.bulletSpacing) {
			if (this.gotSupplyCount == 0) {
				this.createBullet();
			} else if (this.gotSupplyCount == 1) {
				this.createBullet2();
			} else {
				this.createBullet3();
			}
			this.bulletCount = 0;
		}
		this.enemyCount++;
		if (this.enemyCount >= this.enemySpacing) {
			this.createEnemy();
			this.enemyCount = 0;
		}
		this.helicopterCount++;
		if (this.helicopterCount >= this.helicopterSpacing) {
			this.createHelicopter();
			this.helicopterCount = 0;
		}
		if (!this.hasBoss) {
			this.bossCount++;
		}
		if ((this.score / 240) >= 1 && this.bossCount >= this.bossSpacing) {
			this.createBoss();
			this.hasBoss = true;
			this.bossCount = 0;
		}
		this.supplyCount++;
		if (this.supplyCount >= this.supplySpacing) {
			this.createSupply();
			this.supplyCount = 0;
		}
		this.supBombCount++;
		if (this.supBombCount > this.supBombSpacing) {
			this.createSupBomb();
			this.supBombCount = 0;
		}
		// 难度升级
		this.timer++;
		if (this.timer > 400) {
			this.timer = 0;
			if (this.enemySpacing > 15) {
				this.enemySpacing -= 3;
			}
			if (this.helicopterSpacing > 80) {
				this.helicopterSpacing -= 30;
			}
			if (this.enemyDistance < 24) {
				this.enemyDistance++;
			}
			if (this.helicopterDistance < 23) {
				this.helicopterDistance++;
			}
		}
	},
});