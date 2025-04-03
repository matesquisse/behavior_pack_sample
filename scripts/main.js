import {
  world,
  system,
  BlockPermutation,
  ItemStack,
  DisplaySlotId,
  EntityInventoryComponent,
  EntityHealthComponent,
  EntityComponentTypes,
  MolangVariableMap,
  EasingType,
  //MinecraftBlockTypes
  /*,
  Vector3 */
} from "@minecraft/server";

import { ActionFormData } from "@minecraft/server-ui";
import { MinecraftEffectTypes } from "vanilla-data.js";

let waveGoal = 0;
let waveStart = false;
let waveTimer = 0;
let bossSpawnTimer4Bridge = 0;
let bossSpawn4Bridge = false;
let currentWave = 0;
let timeForLooting = 0;
let mobsToSpawn = 0;
let openExtractMenuAfterDelay = 0;12
let goldNuggetCount = 0;
let ironNuggetCount = 0;
let retryCount = 3;
let bossFight4BridgeStarted = false;
let doParticles = false;
let sonicTimer = 0;
let sonicSpellActivation = false;
const { scoreboard } = world;
const bossSpells = ["summonSkeletons", "demonHands"];
let spellCooldown = 400;
let spellActive = false;
let timerToRemoveHandsAnimation = 0;
let handsAnimationIsPlayer = false;
let handsAttackEntity = 0;
let gradualItemDropAnimation = false;
let firstSpawnOfSession = true;

const spawnLoctions4Bridge = [
  { x: 4, y: -53, z: -37 },
  { x: 13, y: -56, z: -30 },
  { x: 23, y: -56, z: -30 },
  { x: 26, y: -56, z: -33 },
  { x: 26, y: -56, z: -41 },
  { x: -15, y: -49, z: -38 },
  { x: -28, y: -51, z: -31 },
  { x: -38, y: -51, z: -31 },
  { x: -42, y: -51, z: -37 },
  { x: -43, y: -50, z: -72 },
  { x: -38, y: -50, z: -89 },
  { x: -28, y: -50, z: -88 },
  { x: 9, y: -55, z: -87 },
  { x: 19, y: -55, z: -88 },
  { x: 26, y: -55, z: -83 },
  { x: 26, y: -55, z: -74 },
  { x: 16, y: -54, z: -45 },
  { x: 16, y: -52, z: -57 },
  { x: 15, y: -52, z: -77 },
  { x: -3, y: -52, z: -80 },
  { x: -12, y: -50, z: -80 },
  { x: -28, y: -46, z: -75 },
  { x: -34, y: -47, z: -62 },
  { x: -35, y: -47, z: -48 }
];

function rollDropItem() {
  const roll = Math.random();

  if (roll < 0.01) { 
      if (Math.random() < 0.5) {
          return new ItemStack("minecraft:netherite_sword", 1);
      } else {
          return new ItemStack("minecraft:netherite_chestplate", 1);
      }
  } else if (roll < 0.25) { // 24% chance for iron armor
      return new ItemStack("minecraft:iron_chestplate", 1);
  } else if (roll < 0.70) { // 45% chance for stone sword
      return new ItemStack("minecraft:golden_apple", 1);
  } else { // 30% chance for gold ingot stack
      return new ItemStack("minecraft:gold_nugget", 10);
  }
}

function healPlayer(player) {
  try {
    const health = player.getComponent(EntityComponentTypes.Health);
    health.resetToMaxValue();
    let duration = 100;
    player.addEffect(MinecraftEffectTypes.Saturation, duration, { amplifier: 1 });
    //player.addEffect(MinecraftEffectTypes.Hunger, 1, { amplifier: 0 });
    player.sendMessage(`Health attempted to restore`);
  } catch (error) {
    world.sendMessage(
      "Something is preventing the HP restore..." +
        error.message
    );
  }
}

function castSummonSkeletons() {
  let playerDimension = getPlayerDimension();
  test2.playAnimation("animation.test_2.sniff");
  world.sendMessage("Skeletons arise from the ground!");
  let skeleton1, skeleton2;

  try{
    skeleton1 = playerDimension.spawnEntity("minecraft:skeleton", {
      x: 65,
      y: -48,
      z: -160
    });
    skeleton2 = playerDimension.spawnEntity("minecraft:skeleton", {
      x: 65,
      y: -48,
      z: -180
    });
  } catch (error){
    world.sendMessage(
      "Something is preventing the spawning of skeletons..." +
        error.message
    );
  }
  
  try{
    //these do not work either, IDK why
    //skeleton1.getComponent(EntityComponentTypes.Health).setCurrentValue(100);
    //skeleton2.getComponent(EntityComponentTypes.Health).setCurrentValue(100);

    //these don't work, kinda expected
    //skeleton1.playAnimation("animation.skeleton2.emerge");
    //skeleton2.playAnimation("animation.skeleton2.emerge");
  } catch (error){
    world.sendMessage(
      "Something is preventing the HP setting of skeletons..." +
        error.message
    );
  }
  
  // Reset spell active flag
  spellActive = false;
}

function castDemonHands() {
  let playerDimension = getPlayerDimension();
  // Spawn entity & Play animation - need to remove later
  world.sendMessage("Demonic hands are rising! Leave the marked area!");

  const areaMinX = 61;
  const areaMaxX = 68;
  const areaZMin = -181;
  const areaZMax = -161;

  try{
    handsAttackEntity = playerDimension.spawnEntity("custom:hands_attack", {
      x: 61,
      y: -50,
      z: -171
    });
  
    handsAttackEntity.setRotation({ x: 270, y: 270 });
  
    //do the animatinon
  
    timerToRemoveHandsAnimation = 100;
    handsAnimationIsPlayer = true;
  
    spellActive = false;
  } catch (error) {
    world.sendMessage(
      "Something is preventing deez hands..." +
        error.message
    );
  }
}


function checkNuggets(){
  try {
    let player = getPlayer();
    let inventory = player.getComponent(EntityInventoryComponent.componentId);
    //let goldNuggetCount = 0;

    for (let slot = 0; slot < inventory.container.size; slot++) {
      let item = inventory.container.getItem(slot);

      try{
        //player.sendMessage("Detected item: " + item.typeId);

        if (item && item.typeId === "minecraft:gold_nugget") {
          goldNuggetCount += item.amount;
        }
      } catch (error){
        world.sendMessage(
          "Something is preventing the counting:" + error.message
        );
      }
    }
    /*
    player.sendMessage(
      "(test)Looks like you have nuggets in the number of: " +
        goldNuggetCount
    );
    */
  } catch (error) {
    //typeId is undefined for empty slots and !== undefine and true check don't work to fix try
    world.sendMessage(
      "Something is preventing the buy process..." + error.message
    );
    
  }
  //return goldNuggetCount;
}

function checkSilver(){
  try {
    let player = getPlayer();
    let inventory = player.getComponent(EntityInventoryComponent.componentId);
    //let goldNuggetCount = 0;

    for (let slot = 0; slot < inventory.container.size; slot++) {
      let item = inventory.container.getItem(slot);

      try{
        //player.sendMessage("Detected item: " + item.typeId);

        if (item && item.typeId === "minecraft:iron_nugget") {
          ironNuggetCount += item.amount;
        }
      } catch (error){
        world.sendMessage(
          "Something is preventing the counting:" + error.message
        );
      }
    }
    /*
    player.sendMessage(
      "(test)Looks like you have nuggets in the number of: " +
        goldNuggetCount
    );
    */
  } catch (error) {
    //typeId is undefined for empty slots and !== undefine and true check don't work to fix try
    world.sendMessage(
      "Something is preventing the buy process..." + error.message
    );
    
  }
  //return goldNuggetCount;
}

function runCutscene() {
  for (const player of world.getPlayers()) {
      const location = player.location;
      player.camera.setCamera("minecraft:free", {
          location: { x: location.x, y: location.y + 10, z: location.z },
          rotation: { x: 90, y: 0 },
      });
      system.run(() => {
          player.camera.setCamera("minecraft:free", {
              location: player.getHeadLocation(),
              rotation: player.getRotation(),
              easeOptions: {
                  easeTime: 1.0,
                  easeType: EasingType.InCubic,
              },
          });
          system.runTimeout(() => {
              player.camera.clear();
              player.runCommandAsync("/inputpermission @s camera enabled");
              player.runCommandAsync("/inputpermission @s movement enabled");
          }, 20);
      });
      player.runCommandAsync("/inputpermission @s camera disabled");
      player.runCommandAsync("/inputpermission @s movement disabled");
  }
}

function purchaseGold(){
  //player.sendMessage("Ready to try the purchase!");
  let player = getPlayer();
  let amountRemaining = 10;
  let inventory = player.getComponent(EntityInventoryComponent.componentId);

  try {
    if (ironNuggetCount >= amountRemaining) {
      //player.sendMessage("It looks like you have enough, trying to complete the purchase.");

      //for every slot of the inventory
      for (let slot = 0; slot < inventory.container.size; slot++){
        //player.sendMessage("Measuring a slot");
        let item = inventory.container.getItem(slot);

        //check if the item is gold nugget and price hasn't been paid yet
        if (item && item.typeId === "minecraft:iron_nugget" && amountRemaining > 0) {
          //player.sendMessage("A gold nugget found in inventory...");
          //and then for each item of this nature
          for (let itemFound = 0; itemFound < amountRemaining; itemFound++){
            //player.sendMessage("Trying to deduce the nugget amount.");
            //remove an amount of the selected item

            //new variable which takes the current nugget count and deduces by 1
            let newNumber = item.amount - 1;
            //player.sendMessage("Nuggest in the stack detected: " + item.amount);
            //player.sendMessage("Attempting to set new amount as: " + newNumber);

            //creates new variable to define new item which will be set in the same slot
            //const newItemState = new ItemStack("minecraft:gold_nugget", newNumber);

            if(newNumber > 0){
              //player.sendMessage("Removing the item because only 1 left");
              //need to remove the final item somehow
              const newItemState = new ItemStack("minecraft:iron_nugget", newNumber);
              inventory.container.setItem(slot, newItemState);
              item = newItemState;
            } else {
              //player.sendMessage("Removing the item because only 1 left");
              const newItemState = new ItemStack("minecraft:bone", 1);
              inventory.container.setItem(slot, newItemState);
              amountRemaining = amountRemaining - itemFound - 1;
              break;
              //item = newItemState;
            }

            //finalise the setting of new amount within the slot
            //inventory.container.setItem(slot, newItemState);

            //updating item variable to be our new state
            //item = newItemState;

            if (amountRemaining-itemFound === 1){
              //player.sendMessage("Trying to add the sword.");
              const purchasedItem = new ItemStack("minecraft:gold_nugget", 1);
              inventory.container.addItem(purchasedItem);
              slot = inventory.container.size;
            }
          }
        }
      }

    } else {
      player.sendMessage("It looks like you don't have enough nuggies.");
    }
  } catch (error) {
    
    world.sendMessage(
      "Something is preventing the buying function:" + error.message
    );
    
  }
}

function purchaseOrder(player, itemOrder, price){
  //player.sendMessage("Ready to try the purchase: " + itemOrder);
  let amountRemaining = price;
  let inventory = player.getComponent(EntityInventoryComponent.componentId);

  try {
    if (goldNuggetCount >= amountRemaining) {
      //player.sendMessage("It looks like you have enough, trying to complete the purchase.");

      //for every slot of the inventory
      for (let slot = 0; slot < inventory.container.size; slot++){
        //player.sendMessage("Measuring a slot");
        let item = inventory.container.getItem(slot);

        //check if the item is gold nugget and price hasn't been paid yet
        if (item && item.typeId === "minecraft:gold_nugget" && amountRemaining > 0) {
          //player.sendMessage("A gold nugget found in inventory...");
          //and then for each item of this nature
          for (let itemFound = 0; itemFound < amountRemaining; itemFound++){
            //player.sendMessage("Trying to deduce the nugget amount.");
            //remove an amount of the selected item

            //new variable which takes the current nugget count and deduces by 1
            let newNumber = item.amount - 1;
            //player.sendMessage("Nuggest in the stack detected: " + item.amount);
            //player.sendMessage("Attempting to set new amount as: " + newNumber);

            //creates new variable to define new item which will be set in the same slot
            //const newItemState = new ItemStack("minecraft:gold_nugget", newNumber);

            if(newNumber > 0){
              //player.sendMessage("Setting new nugget state");
              //need to remove the final item somehow
              const newItemState = new ItemStack("minecraft:gold_nugget", newNumber);
              inventory.container.setItem(slot, newItemState);
              item = newItemState;
            } else {
              //player.sendMessage("Removing the item because only 1 left");
              const newItemState = new ItemStack("minecraft:iron_nugget", 1);
              inventory.container.setItem(slot, newItemState);
              amountRemaining = amountRemaining - itemFound - 1;
              //player.sendMessage("amountRemaining: " + amountRemaining + " itemFound: " + itemFound);

              if (amountRemaining === 0){
                itemFound = -1;
              } else {
                break;
              }

              //break;
              //item = newItemState;
            }

            //finalise the setting of new amount within the slot
            //inventory.container.setItem(slot, newItemState);

            //updating item variable to be our new state
            //item = newItemState;

            if (amountRemaining-itemFound === 1){
              player.sendMessage("Trying to add the item to inventory!");
              const purchasedItem = new ItemStack(itemOrder, 1);
              inventory.container.addItem(purchasedItem);
              slot = inventory.container.size;
            }
          }
        }
      }

    } else {
      player.sendMessage("It looks like you don't have enough nuggies.");
    }
  } catch (error) {
    
    world.sendMessage(
      "Something is preventing the buying function:" + error.message
    );
    
  }
}

function openFoodShop() {
  let player = getPlayer();
  const foodShop = new ActionFormData();

  foodShop.button("1 gold", "textures/items/apple");
  foodShop.button("3 gold", "textures/items/apple_golden");
  foodShop.button("3 gold", "textures/items/potion_bottle_heal");

  foodShop.show(player).then((response) => {
    if (response.canceled) {
      // can be nothing, I think
    }
    if (response.selection === 0) {
      checkNuggets();
      let price = 1;
      let itemOrder = "minecraft:apple";
      purchaseOrder(player, itemOrder, price); 
    }
    if (response.selection === 1) {
      checkNuggets();
      let price = 3;
      let itemOrder = "minecraft:golden_apple";
      purchaseOrder(player, itemOrder, price); 
    }
    if (response.selection === 2) {
      world.sendMessage(
        "Coming soon! Honestly no idea how to potion..."
      );
    }
  });
}

function showClassMenu(){
  let player = getPlayer();
  const classMenu = new ActionFormData();

  classMenu.button("Warrior", "textures/items/stone_sword");
  classMenu.button("Wizard", "textures/items/iron_sword");
  classMenu.button("Ranger", "textures/items/diamond_sword");
  classMenu.button("Cleric", "textures/items/diamond_sword");

  classMenu.show(player).then((response) => {
    if (response.canceled) {
      // can be nothing, I think
    }
    if (response.selection === 0) {
      player.setDynamicProperty("currentClass", "warrior");
    }
    if (response.selection === 1) {
      //wizard
    }
    if (response.selection === 2) {
      //ranger
    }
    if (response.selection === 3) {
      //cleric
    }
  });
}

function openWeaponShop() {
  let player = getPlayer();
  const weaponShop = new ActionFormData();

  weaponShop.button("5 gold", "textures/items/stone_sword");
  weaponShop.button("20 gold", "textures/items/iron_sword");
  weaponShop.button("100 gold", "textures/items/diamond_sword");

  weaponShop.show(player).then((response) => {
    if (response.canceled) {
      // can be nothing, I think
    }
    if (response.selection === 0) {
      checkNuggets();
      let price = 5;
      let itemOrder = "minecraft:stone_sword";
      purchaseOrder(player, itemOrder, price); 
    }
    if (response.selection === 1) {
      checkNuggets();
      let price = 20;
      let itemOrder = "minecraft:iron_sword";
      purchaseOrder(player, itemOrder, price); 
    }
    if (response.selection === 2) {
      try {
        checkNuggets();
        let price = 100;
        let itemOrder = "minecraft:diamond_sword";
        purchaseOrder(player, itemOrder, price); 
      } catch (error) {
        world.sendMessage(
          "Something is preventing extracting the function: " + error.message
        );
      }
    }
  });
}

function openShop() {
  //player.sendMessage("About to try opening the shop.");
  try {
    //player.sendMessage("Form is getting defined.");
    const formShop = new ActionFormData();
    const weaponShop = new ActionFormData();
    formShop.title("Welcome to the shop!");
    //form.body("Choose your next move!");
    formShop.button("Weapons", "textures/items/netherite_sword");
    formShop.button("Armour (placeholder)", "textures/items/netherite_helmet");
    formShop.button("Food and potions", "textures/items/potion_bottle_heal");
    formShop.button("Gold (10 iron nugget each)", "textures/items/gold_nugget");
    //formShop.button("Testing animation", "textures/items/gold_nugget");

    for (const player of world.getAllPlayers()) {
      formShop.show(player).then((response) => {
        if (response.canceled) {
          //can be nothing i think
        }
        if (response.selection == 0) {
          try {
            openWeaponShop();
          } catch (error) {
            world.sendMessage(
              "Something is preventing the shop opening..." + error.message
            );
          }
        }
        if (response.selection == 1) {
          //option 2
        }
        if (response.selection == 2) {
          openFoodShop();
        }
        if (response.selection == 3) {
          checkSilver();
          purchaseGold();
        }
        if (response.selection == 4) {
          //test2.triggerEvent("minecraft:spawn_emerging");
          //test2.playAnimation("animation.test_2.emerge");
          test2.playAnimation("animation.test_2.sonic_boom");
        }
        return;
      }); // show player the form
    }
  } catch (error) {
    world.sendMessage(
      "Something is preventing the shop opening..." + error.message
    );
  }
}

function openDungeonMenu(){
  let player = getPlayer();

  player.teleport({ x: 24, y: -56, z: -40 });
  const form = new ActionFormData();
  form.title("Choose the dungeon!");
  form.button("4 Bridge Dungeon", "textures/items/campfire");
  form.button(
    "Lesser Inferno (Boss Battle)",
    "textures/items/stone_shovel"
  );

  for (const player of world.getAllPlayers()) {
    form.show(player).then((response) => {
      if (response.canceled) {
        //player.sendMessage("Canceled due to " + response.cancelationReason);
        //player.sendMessage("Extra 60 seconds to loot!");
        //ISSUE IF USER IS BUSY...
        timeForLooting = 1200;
      }
      if (response.selection == 0) {
        try {
          waveStart = true;
          waveTimer = 100;
          currentWave = 1;
        } catch (error) {
          world.sendMessage(
            "Something is preventing zombie spawn..." + error.message
          );
        }
      }
      if (response.selection == 1) {
        player.teleport({ x: 105, y: -49, z: -170 });
        //player.sendMessage("Teleport complete, setting timer.");
        bossSpawnAnimation4Bridge = false;
        bossSpawnTimer4Bridge = 100;
        bossSpawn4Bridge = true;
      }
      return;
    }); // show player the form
  }
}

function showExtractionOptions(player) {
  try {
    const form = new ActionFormData();
    form.title("Wave completed!");
    form.body("Choose your next move!");
    form.button("Get back to safety!", "textures/items/soul_campfire");
    form.button(
      "More time to loot current dungeon!",
      "textures/items/stone_shovel"
    );
    form.button("Continue to next wave!", "textures/items/campfire");

    for (const player of world.getAllPlayers()) {
      form.show(player).then((response) => {
        if (response.canceled) {
          //player.sendMessage("Canceled due to " + response.cancelationReason);
          player.sendMessage("Extra 60 seconds to loot!");
          //ISSUE IF USER IS BUSY...
          timeForLooting = 1200;
        }
        if (response.selection == 0) {
          //kinda messy NGL but not the time to fix I think...
          player.sendMessage("Going back to safety!");
          player.teleport({ x: -30, y: -60, z: -144 });
          currentWave = 0;

          try {
            healPlayer(player);

            const entities = world
              .getDimension("overworld")
              .getEntities({ excludeTypes: ["minecraft:player"] });

            world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);

            for (const entity of entities) {
              entity.remove();
            }
            //world.scoreboard.removeObjective(scoreboardObjectiveId);
          } catch (error) {
            world.sendMessage(
              "Something is preventing scoreboard/entity removal..." +
                error.message
            );
          }
        }
        if (response.selection == 1) {
          player.sendMessage("Extra 60 seconds to loot!");
          //ISSUE IF USER IS BUSY...
          timeForLooting = 1200;
        }
        if (response.selection == 2) {
          player.sendMessage("Moving on!");
          waveTimer = 100;
          currentWave++;
          waveStart = true;
        }
        return;
      }); // show player the form
    }
  } catch (error) {
    world.sendMessage("Something is preventing button... " + error.message);
  }
}

//my goodness we can use this for the shop UI but really shouldn't
let test2 = false;

try {
  const formLobby = new ActionFormData();
  formLobby.button("Boss room test!", "textures/items/wooden_shovel");
  formLobby.button("Test particles", "textures/items/diamond_shovel");
  formLobby.button("Test class menu", "textures/items/diamond_shovel");
  formLobby.button("Try new mob", "textures/items/diamond_shovel");
  formLobby.button("Try title", "textures/items/diamond_shovel");
  formLobby.button("Camera", "textures/items/diamond_shovel");

  for (const player of world.getAllPlayers()) {
    formLobby.show(player).then((response) => {
      if (response.canceled) {
        //player.sendMessage("Canceled due to " + response.cancelationReason);
      }
      if (response.selection == 0) {
        player.teleport({ x: 105, y: -49, z: -170 });
        player.sendMessage("Teleport complete, setting timer.");
        bossSpawnTimer4Bridge = 100;
        bossSpawn4Bridge = true;
      }
      if (response.selection == 1) {
        try {
          //player.playMusic('lobby.ogg');
          //player.sendMessage("Trying to play music!");

          let playerDimension = getPlayerDimension();
          let playerLocation = getPlayerLocation();
          let campfireLocation1 = { x: -24, y: -60, z: -141};
          let player = getPlayer();

          player.sendMessage("Trying to set the block to lit.");
          player.runCommand("setblock -24 -60 -141 campfire");


          // at -24 -60 -141 replace the campfire with lit campfire

          /*
          playerDimension.spawnParticle(
            "custom:campfire_activation",
            {
              x: playerLocation.x,
              y: playerLocation.y + 1,
              z: playerLocation.z,
            }
          );
          */

        } catch (error){
          world.sendMessage(
            "Something is preventing sound play..." + error.message
          );
        }
      }
      if (response.selection == 2) {
        showClassMenu();
      }
      if (response.selection == 3) {
        player.sendMessage("Trying to spawn the new mob!");
        let playerDimension = getPlayerDimension();
        let spawnLocation = getPlayerLocation();
        let mobType = "custom:hands_attack";

        test2 = playerDimension.spawnEntity(mobType, {
          x: spawnLocation.x,
          y: spawnLocation.y,
          z: spawnLocation.z,
        });

        try{
          //test2.playAnimation("animation.test_2.emerge2");
          player.sendMessage("Animation should be live!");
          //test2.triggerEvent("minecraft:spawn_emerging");
        } catch (error){
          world.sendMessage(
            "Something is preventing animation..." + error.message
          );
        }

      }
      if (response.selection == 4) {
        let player = getPlayer();

        player.onScreenDisplay.setTitle("§l§6Enemy Felled§r");

      }
      if (response.selection == 5) {
        let playerDimension = getPlayerDimension();
          let playerLocation = getPlayerLocation();

          playerDimension.spawnParticle(
            "custom:campfire_activated",
            {
              x: playerLocation.x,
              y: playerLocation.y + 1,
              z: playerLocation.z,
            }
          );

      }
      return;
    }); // show player the form
  }
} catch (error) {
  world.sendMessage("Something is preventing button... " + error.message);
}


function getPlayer() {
  const allPlayers = world.getAllPlayers();
  if (allPlayers.length === 0) {
    return undefined;
  }

  return allPlayers[0];
}

function getPlayerDimension() {
  const player = getPlayer();
  if (player === undefined) {
    return undefined;
  }
  return player.dimension;
}

function getPlayerLocation() {
  const player = getPlayer();
  if (player === undefined) {
    return undefined;
  }
  return player.location;
}

function spawnRandomMob() {
  const playerDimension = getPlayerDimension();
  // Generate a random index to select a location from the array
  const randomIndex = Math.floor(Math.random() * spawnLoctions4Bridge.length);
  const randomMobType = Math.random();
  const rareMobChance = 0.01 + currentWave * 0.01;
  let mobType = "minecraft:zombie";

  // Get the random spawn location
  const spawnLocation = spawnLoctions4Bridge[randomIndex];
  //world.sendMessage("Spawned at: " + spawnLocation.x + spawnLocation.y + spawnLocation.z);

  if(randomMobType < rareMobChance){
    mobType = "custom:skeleton2";
  } else if (randomMobType > 0.5){
    mobType = "minecraft:skeleton";
  }

  // Spawn the mob (assuming you have the appropriate mob spawn function)
  try {
    //world.spawnEntity("minecraft:zombie", {spawnLocation.x, spawnLocation.y, spawnLocation.z});
    playerDimension.spawnEntity(mobType, {
      x: spawnLocation.x,
      y: spawnLocation.y,
      z: spawnLocation.z,
    });

    retryCount = 3;
  } catch (error) {
    //will need to fix this later to not show and to have a limit in case of infinite loop
    world.sendMessage("Something is preventing mob spawn... " + error.message);

    if(retryCount > 0){
      spawnRandomMob();
      retryCount--;
    }
  }
}

world.afterEvents.entityDie.subscribe((event) => {
  const player = getPlayer();
  const target = event.deadEntity;

  if (target === test2){
    bossFight4BridgeStarted = false;
    doParticles = false;

    player.teleport({ x: -30, y: -58, z: -142 });
    healPlayer(player);

    //loot drop
    gradualItemDropAnimation = true;
    dropsRemaining = 10;

    //feedback message
    player.sendMessage(`Thank you for testing the new boss! Please leave feedback if the boss was too difficult or too easy, and what moves you would prefer to be added.`);
  }

  if (target != player && currentWave > 0) {
    //player.sendMessage(`Wowzers, ${target.typeId} has died`);
    waveGoal--;
    player.sendMessage(`Monsters left: ${waveGoal}`);

    if (waveGoal < 1) {
      player.sendMessage(`Wave completed! Prepare for the next round!`);
      
      try {
        player.playSound("ambient.weather.thunder");
      } catch (error){
        world.sendMessage(
          "Something is preventing sound play..." + error.message
        );
      }
      
      openExtractMenuAfterDelay = 60;

      //showExtractionOptions(player);
      //waveTimer = 100;
      //currentWave++;
      //waveStart = true;

      //countToNextWaveAndStart();
      //set scoreboard to wave 2
    }
  }
  /*
if(target === player){


  player.teleport(
    { x: -36, y: -60, z: -150 },
  );
}
*/
});

world.afterEvents.playerSpawn.subscribe((event) => {
  const player = getPlayer();
  //player.sendMessage(`Player respawn detected`);
  //const target = event.entity;

  let currentClass = player.getDynamicProperty("currentClass") ?? "Not set";
  //world.sendMessage(`Your current class is: ${currentClass}`);

  try {
    const inventory = player.getComponent("inventory");
    const item = new ItemStack("minecraft:wooden_shovel", 1);
    inventory.container.addItem(item);
    //system.run(mainTick);
  } catch (error) {
    world.sendMessage(
      "Something is preventing spawn detection message" + error.message
    );
  }

  if(firstSpawnOfSession){
    system.run(mainTick);
    firstSpawnOfSession = false;
  }

  //doParticles = true;
    
});

world.afterEvents.entityHealthChanged.subscribe((event) => {
  const player = getPlayer();
  const target = event.entity;
  //const healthOld = event.oldValue;
  const healthNew = event.newValue;
  const dimension = getPlayerDimension();

  if (target === player && healthNew <= 0) {
    player.sendMessage(`Uh oh! Time to go back!`);
    waveStart = false;
    currentWave = 0;
    bossFight4BridgeStarted = false;
    doParticles = false;

    player.teleport({ x: -30, y: -60, z: -144 });

    // remove all entities
    try {
      const entities = world
        .getDimension("overworld")
        .getEntities({ excludeTypes: ["minecraft:player"] });

      world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);

      for (const entity of entities) {
        entity.remove();
      }
      //world.scoreboard.removeObjective(scoreboardObjectiveId);
    } catch (error) {
      world.sendMessage(
        "Something is preventing scoreboard/entity/resetting chest removal..." +
          error.message
      );
    }

    try {
      //remove all items
      const inventory = player.getComponent("inventory");
      inventory.container.clearAll();
    } catch (error) {
      world.sendMessage(
        "Something is preventing clearing the inventory..." + error.message
      );
    }

    try {
      player.setSpawnPoint({ dimension, x: -30, y: -60, z: -144 });
    } catch (error) {
      world.sendMessage(
        "Something is preventing spawn setting..." + error.message
      );
    }
  }
});

/*
world.afterEvents.entitySpawn.subscribe((event) => {
  const { entity } = event;
  world.sendMessage(`${entity.typeId} is spawned`);
});
*/

world.afterEvents.entityHurt.subscribe((event) => {
  const damage = event.damage;
  const entity = event.hurtEntity;

  if (entity.typeId === "custom:inferno_hitbox"){
    test2.applyDamage(damage);
    const hitboxHP = entity.getComponent(EntityComponentTypes.Health).currentValue;
  }
});

world.afterEvents.playerInteractWithBlock.subscribe((eventData) => {
  let player = getPlayer();
  const { block } = eventData;

  // -151 is shop -150 is price check -149 is sell item
  world.sendMessage(`Block ${block.x} ${block.y} ${block.z} got Interacted`);

  if(block.z === -151 && block.x < -34){
    //world.sendMessage(`Attempting to open shop`);
    openShop();
  }

  if(block.z === -24 && block.x < -141){
    player.playSound("campfire.activation");
    player.sendMessage("Sound/campfire activating!!!!");
    // initial partcile animation
    // timer for part 2
    // at part 2 timing remove particles, place ending
    // activation placeholder
  }

});

/* WAS USED FOR DEBUGGING
world.afterEvents.entityRemove.subscribe((eventData) => {
  // Extract the type ID of the removed entity from the event data
  const { typeId } = eventData;

  // Send a message to all players in the world indicating that an entity of the given type has been removed
  world.sendMessage(`Entity ${typeId} got removed`);
});
*/

function checkIfPlayerInZoneForHands(){
  let playerLocation = getPlayerLocation();
  let player = getPlayer();

  if (
    playerLocation.x > 60 &&
    playerLocation.x < 69 &&
    playerLocation.z > -182 &&
    playerLocation.z < -160
  ){
    player.applyDamage(25);
  }
  //if in zone = 25 damage
}

let bossSpawnAnimation4Bridge = false;
let bossSpawnAnimationDurtation4Bridge = 0;
let dropTickCounter = 0;
let dropsRemaining = 0;

function mainTick() {
  const playerLocation = getPlayerLocation();
  const player = getPlayer();
  const playerDimension = getPlayerDimension();

  if (gradualItemDropAnimation) {
    dropTickCounter++;

    if (dropTickCounter >= 10) {
      dropTickCounter = 0; // reset counter for next drop

      const selectedItem = rollDropItem();
      playerDimension.spawnItem(selectedItem, { x: -30, y: -62, z: -144 });

      dropsRemaining--;
      if (dropsRemaining <= 0) {
        gradualItemDropAnimation = false; // stop animation when done
      }
    }

    //const selectedItem = new ItemStack("minecraft:gold_nugget", newNumber);
    //playerDimension.spawnItem(selectedItem, { x: -30, y: -62, z: -144 });

    //eventually gradualItemDropAnimation = false;
  }

  if (handsAnimationIsPlayer) {
    if (timerToRemoveHandsAnimation > 0) {
      timerToRemoveHandsAnimation--;
      if (timerToRemoveHandsAnimation % 10 === 0) {
        //world.sendMessage(`Trying to spawn particles`);
        for (let x = 61; x <= 68; x++) {
          for (let z = -181; z <= -161; z++) {
            // Set Y to slightly above ground
            const y = -48; // slightly above -50 so it's visually on top of the block

            // Particle location
            const newLocation = { x: x + 0.5, y: y, z: z + 0.5 }; // center of the block

            const molang = new MolangVariableMap();

            molang.setColorRGB("variable.color", {
              red: Math.random(),
              green: 0,
              blue: 0,
            });

            // Spawn particle
            playerDimension.spawnParticle(
              "minecraft:colored_flame_particle",
              newLocation,
              molang
            );
          }
        }
      }
    } else {
      handsAttackEntity.remove();
      checkIfPlayerInZoneForHands();
      handsAnimationIsPlayer = false;
    }
  }

  if (doParticles && system.currentTick % 5 === 0) {
    const radius = 4;
    const numParticles = 20;
    let rotationSpeed = 0.2;
    let angleOffset = 0; // This will track the rotation

    try {
      //world.sendMessage(`Trying to spawn particles`);
      for (let i = 0; i < 100; i++) {
        const angle = (Math.PI * 2 * i) / numParticles + angleOffset;

        const molang = new MolangVariableMap();

        molang.setColorRGB("variable.color", {
          red: Math.random(),
          green: 0,
          blue: 0,
        });

        const newLocation = {
          x: playerLocation.x + radius * Math.cos(angle),
          y: playerLocation.y + 1,
          z: playerLocation.z + radius * Math.sin(angle),
        };

        try {
          playerDimension.spawnParticle(
            "minecraft:dragon_breath_fire",
            newLocation,
            molang
          );
        } catch (error) {
          world.sendMessage(
            "Something is preventing spawning specifically" + error.message
          );
        }
        angleOffset += rotationSpeed;
      }
    } catch (error) {
      world.sendMessage(
        "Something is preventing spawn particles" + error.message
      );
    }
  }

  if (
    bossFight4BridgeStarted &&
    system.currentTick % spellCooldown === 0 &&
    !spellActive
  ) {
    const selectedSpell =
      bossSpells[Math.floor(Math.random() * bossSpells.length)];
    spellActive = true;

    if (selectedSpell === "summonSkeletons") {
      castSummonSkeletons();
    } else if (selectedSpell === "demonHands") {
      castDemonHands();
    }
  }

  if (bossFight4BridgeStarted && sonicSpellActivation) {
    sonicTimer++;
    doParticles = true;
    if (sonicTimer === 100) {
      //play hit sound if not in animation
      player.applyDamage(19);
      sonicSpellActivation = false;
      sonicTimer = 0;
      doParticles = false;
    }
  }

  if (bossFight4BridgeStarted && system.currentTick % 60 === 0) {
    if (
      playerLocation.x > 60 &&
      playerLocation.x < 69 &&
      playerLocation.z > -182 &&
      playerLocation.z < -160
    ) {
      //world.sendMessage("You're inside range!");
    } else {
      if (system.currentTick % 100 === 0) {
        //world.sendMessage("Uh oh, outside range for too long!");
        sonicSpellActivation = true;
        test2.playAnimation("animation.test_2.sonic_boom");
      }
    }
  }

  if (bossSpawn4Bridge) {
    //world.sendMessage("True statement detected");
    if (bossSpawnTimer4Bridge > 0) {
      //world.sendMessage("Counting down to boss: " + bossSpawnTimer4Bridge);
      bossSpawnTimer4Bridge--;
    } else if (bossSpawn4Bridge && bossSpawnTimer4Bridge === 0) {
      //world.sendMessage("Boss spawning!");
      test2 = playerDimension.spawnEntity("custom:test_2", {
        x: 57,
        y: -59,
        z: -171,
      });

      const infernoHitbox = playerDimension.spawnEntity(
        "custom:inferno_hitbox",
        {
          x: 57,
          y: -50,
          z: -171,
        }
      );
      bossSpawn4Bridge = false;
      bossSpawnTimer4Bridge = 100;
      test2.triggerEvent("minecraft:spawn_emerging");
      test2.setRotation({ x: 270, y: 270 });
      bossSpawnAnimation4Bridge = true;
      bossSpawnAnimationDurtation4Bridge = 140;
    }
  }

  if (bossSpawnAnimation4Bridge) {
    //world.sendMessage("True statement detected");
    if (bossSpawnAnimationDurtation4Bridge > 0) {
      //world.sendMessage("Counting down to animation finish!");
      bossSpawnAnimationDurtation4Bridge--;
    } else if (bossSpawnAnimation4Bridge && bossSpawnAnimationDurtation4Bridge === 0) {
      world.sendMessage("Spawn animation finished! Activating event");
      bossSpawnAnimation4Bridge = false;
      bossFight4BridgeStarted = true;
      castSummonSkeletons();
      //test2.playAnimation("animation.test_2.sonic_boom");
    }
  }

  if (timeForLooting > 0) {
    timeForLooting--;
    if (timeForLooting === 1) {
      showExtractionOptions(player);
      timeForLooting--;
    }
  }
  /* THIS WAS FOR TESTING BEFORE TELEPORT
  if (system.currentTick % 200 === 0) {
    const locationMessage = `Location is: ${playerLocation.x} ${playerLocation.y} ${playerLocation.z}`;

    world.sendMessage("It's time:");
    world.sendMessage(locationMessage);
  }
  */

  //LOCATION IF COMPLETE YIPEEEE
  // entry -31 to -30 -60 -154 (x and z are up but since negatives then down -32 and -155)
  if (
    playerLocation.x > -32 &&
    playerLocation.x < -30 &&
    playerLocation.z > -155 &&
    playerLocation.z < -154
  ) {
    let randomChestSpawnNumber = Math.random();
    //player.sendMessage(`Random number is ${randomChestSpawnNumber}`);

    //FULLY FUNCTIONAL BLOCK REPLACEMENT AT RANDOM + item add
    /*
  if(randomChestSpawnNumber > 0.5){
    playerDimension.setBlockType({ x: -161, y: 71, z: 78 }, "minecraft:chest");
    
    const chestForItems = playerDimension.getBlock({ x: -161, y: 71, z: 78 });
    player.sendMessage(`Chest is currently detected as ${chestForItems.typeId}`);

    const inventory = chestForItems.getComponent("inventory").container;
    inventory.addItem(new ItemStack("minecraft:cobblestone", 64));
  } else {
    playerDimension.setBlockType({ x: -161, y: 71, z: 78 }, "minecraft:air");
  }
  */

    //world.sendMessage("X marks the spot!");
    openDungeonMenu();
    //player.teleport({ x: 24, y: -56, z: -40 });

    //world.sendMessage("Teleport is complete, trying to spawn zombie");

    //ERROR DETECTION IMPLETMENTED
    // across the arena spawn 24 -56 -40
    /*
    try {
      waveStart = true;
      waveTimer = 100;
      currentWave = 1;
    } catch (error) {
      world.sendMessage(
        "Something is preventing zombie spawn..." + error.message
      );
    }
      */
  }

  // exit -44 -50 -80 to -81
  if (
    playerLocation.x > -45 &&
    playerLocation.x < -44 &&
    playerLocation.z > -82 &&
    playerLocation.z < -80
  ) {
    player.teleport({ x: -3, y: -60, z: -144 });
    currentWave = 0;
    healPlayer(player);

    try {
      const entities = world
        .getDimension("overworld")
        .getEntities({ excludeTypes: ["minecraft:player"] });

      world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);

      for (const entity of entities) {
        entity.remove();
      }
      //world.scoreboard.removeObjective(scoreboardObjectiveId);
    } catch (error) {
      world.sendMessage(
        "Something is preventing scoreboard/entity removal..." + error.message
      );
    }
    // button for price check -36 -60 -150
  }

  if (waveStart) {
    waveTimer--;
    //world.sendMessage("Timer started and is currently: " + waveTimer);

    if (waveTimer < 1) {
      try {
        world.sendMessage("Wave begins!");
        const scoreboardObjectiveId = "scoreboard_demo_objective";
        const scoreboardObjectiveDisplayName = "Wave";

        // Ensure a new objective.
        let objective = world.scoreboard.getObjective(scoreboardObjectiveId);

        if (!objective) {
          objective = world.scoreboard.addObjective(
            scoreboardObjectiveId,
            scoreboardObjectiveDisplayName
          );
        } else {
          /*
          world.sendMessage(
            "Looks like there was already an objective... Trying to remove."
          );
          */
          world.scoreboard.clearObjectiveAtDisplaySlot(DisplaySlotId.Sidebar);
          world.scoreboard.removeObjective(scoreboardObjectiveId);
          objective = world.scoreboard.addObjective(
            scoreboardObjectiveId,
            scoreboardObjectiveDisplayName
          );
        }

        objective.setScore(player, currentWave);

        world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
          objective: objective,
          //sortOrder: ObjectiveSortOrder.Descending,
        });

        const playerScore = objective.getScore(player) || 0;

        // score should now be 110.
        //objective.setScore(player, playerScore + 10);
      } catch (error) {
        world.sendMessage(
          "Something is preventing scoreboard..." + error.message
        );
      }

      /* OLD SYSTEM INSTA SPAWN, NEED TO MAKE IT GRADUAL
      for (let i = 0; i < currentWave; i++) {
        spawnRandomMob();
      }
      */

      //playerDimension.spawnEntity("minecraft:zombie", { x: 4, y: -49, z: -37 });
      //world.sendMessage("Zombie spawned, setting the wave goal.");
      // 4 -49 -37
      waveGoal = currentWave;
      mobsToSpawn = currentWave;
      waveStart = false;
    }
  }

  if (system.currentTick % 60 === 0 && mobsToSpawn > 0) {
    //world.sendMessage("Trying to spawn a mob");
    spawnRandomMob();
    mobsToSpawn--;
  }

  if (openExtractMenuAfterDelay > 0) {
    if (openExtractMenuAfterDelay === 1) {
      showExtractionOptions(player);
    }
    openExtractMenuAfterDelay--;
  }

  system.run(mainTick);
}

system.run(mainTick);
