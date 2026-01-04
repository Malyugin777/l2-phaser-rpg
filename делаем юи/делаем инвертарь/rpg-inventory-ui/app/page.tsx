"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sword, Shield, Sparkles, Crown, Gem, Coins, Zap, Heart, Swords, ShieldCheck, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Rarity = "common" | "uncommon" | "rare" | "epic"

interface InventoryItem {
  id: string
  name: string
  type:
    | "helmet"
    | "chest"
    | "pants"
    | "gloves"
    | "boots"
    | "mainHand"
    | "offHand"
    | "necklace"
    | "earring1"
    | "earring2"
    | "ring1"
    | "ring2"
  rarity: Rarity
  level: number
  attack?: number
  defense?: number
  hp?: number
}

const rarityColors = {
  common: "border-zinc-600",
  uncommon: "border-green-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
}

const rarityGlow = {
  common: "shadow-none",
  uncommon: "shadow-[0_0_10px_rgba(34,197,94,0.3)]",
  rare: "shadow-[0_0_10px_rgba(59,130,246,0.3)]",
  epic: "shadow-[0_0_10px_rgba(168,85,247,0.3)]",
}

export default function InventoryScreen() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [equippedItems, setEquippedItems] = useState<Record<string, InventoryItem | null>>({
    helmet: null,
    chest: null,
    pants: null,
    gloves: null,
    boots: null,
    mainHand: null,
    offHand: null,
    necklace: null,
    earring1: null,
    earring2: null,
    ring1: null,
    ring2: null,
  })

  const inventoryItems: InventoryItem[] = [
    { id: "1", name: "Iron Sword", type: "mainHand", rarity: "common", level: 5, attack: 25 },
    { id: "2", name: "Mystic Helm", type: "helmet", rarity: "rare", level: 8, defense: 15, hp: 50 },
    { id: "3", name: "Leather Boots", type: "boots", rarity: "uncommon", level: 3, defense: 8 },
    { id: "4", name: "Dragon Blade", type: "mainHand", rarity: "epic", level: 15, attack: 85 },
    { id: "5", name: "Steel Plate", type: "chest", rarity: "uncommon", level: 6, defense: 30 },
    { id: "6", name: "Magic Ring", type: "ring1", rarity: "rare", level: 10, hp: 100 },
    { id: "7", name: "Warrior Gloves", type: "gloves", rarity: "common", level: 4, defense: 5 },
    { id: "8", name: "Phoenix Armor", type: "chest", rarity: "epic", level: 20, defense: 65, hp: 200 },
    { id: "9", name: "Steel Shield", type: "offHand", rarity: "uncommon", level: 7, defense: 20 },
    { id: "10", name: "Gold Necklace", type: "necklace", rarity: "rare", level: 12, hp: 75 },
    { id: "11", name: "Diamond Earring", type: "earring1", rarity: "epic", level: 15, attack: 10, hp: 50 },
    { id: "12", name: "Leather Pants", type: "pants", rarity: "common", level: 4, defense: 12 },
  ]

  const handleEquip = () => {
    if (selectedItem) {
      setEquippedItems((prev) => ({
        ...prev,
        [selectedItem.type]: selectedItem,
      }))
      setSelectedItem(null)
    }
  }

  const handleSell = () => {
    if (selectedItem) {
      // Selling logic would go here
      setSelectedItem(null)
    }
  }

  const totalStats = {
    hp: 850 + Object.values(equippedItems).reduce((acc, item) => acc + (item?.hp || 0), 0),
    attack: 120 + Object.values(equippedItems).reduce((acc, item) => acc + (item?.attack || 0), 0),
    defense: 75 + Object.values(equippedItems).reduce((acc, item) => acc + (item?.defense || 0), 0),
  }

  const EquipmentSlot = ({ type, position }: { type: string; position: string }) => {
    const item = equippedItems[type]

    const slotIconMap: Record<string, string> = {
      helmet: "/ui/slots/helmet.svg",
      chest: "/ui/slots/chest.svg",
      pants: "/ui/slots/pants.svg",
      gloves: "/ui/slots/gloves.svg",
      boots: "/ui/slots/boots.svg",
      mainHand: "/ui/slots/mainhand.svg",
      offHand: "/ui/slots/offhand.svg",
      necklace: "/ui/slots/necklace.svg",
      earring1: "/ui/slots/earring.svg",
      earring2: "/ui/slots/earring.svg",
      ring1: "/ui/slots/ring.svg",
      ring2: "/ui/slots/ring.svg",
    }

    return (
      <div className={`flex flex-col items-center gap-1 ${position}`}>
        <div
          className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-all ${
            item
              ? `${rarityColors[item.rarity]} ${rarityGlow[item.rarity]} bg-gradient-to-br from-zinc-800 to-zinc-900`
              : "border-zinc-700 bg-zinc-900/50"
          }`}
        >
          <img
            src={slotIconMap[type] || "/placeholder.svg"}
            alt={type}
            className={`w-7 h-7 ${item ? "opacity-100" : "opacity-50"}`}
          />
        </div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{type}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
        {/* Top Bar */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Warrior</p>
              <p className="text-lg font-bold text-balance">ShadowKnight</p>
              <p className="text-xs text-amber-500">Level 42</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">8,450</span>
              </div>
              <div className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full">
                <Zap className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-semibold">85</span>
              </div>
            </div>
          </div>
        </div>

        {/* Character & Equipment Section */}
        <div className="p-4 space-y-4">
          {/* Equipment Layout */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-2">
              {/* Left Equipment */}
              <div className="space-y-2">
                <EquipmentSlot type="helmet" position="" />
                <EquipmentSlot type="chest" position="" />
                <EquipmentSlot type="pants" position="" />
                <EquipmentSlot type="gloves" position="" />
                <EquipmentSlot type="boots" position="" />
                <EquipmentSlot type="mainHand" position="" />
              </div>

              {/* Character Preview */}
              <div className="flex items-center justify-center">
                <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                  <Shield className="w-16 h-16 text-zinc-600" />
                </div>
              </div>

              {/* Right Equipment */}
              <div className="space-y-2">
                <EquipmentSlot type="offHand" position="" />
                <EquipmentSlot type="necklace" position="" />
                <EquipmentSlot type="earring1" position="" />
                <EquipmentSlot type="earring2" position="" />
                <EquipmentSlot type="ring1" position="" />
                <EquipmentSlot type="ring2" position="" />
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <button
            onClick={() => setShowStatsModal(true)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center justify-between hover:bg-zinc-900/70 transition-colors"
          >
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-semibold">HP {totalStats.hp}</span>
              </div>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-orange-500" />
                <span className="font-semibold">ATK {totalStats.attack}</span>
              </div>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">DEF {totalStats.defense}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          {/* Inventory Title */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-lg font-bold text-balance">Inventory</h2>
            <span className="text-sm text-zinc-500">{inventoryItems.length} items</span>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-6 gap-1.5 pb-24">
            {inventoryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`relative aspect-square rounded-lg border-2 transition-all ${
                  selectedItem?.id === item.id
                    ? `${rarityColors[item.rarity]} ${rarityGlow[item.rarity]} scale-95`
                    : `${rarityColors[item.rarity]} hover:scale-105`
                } bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center p-1`}
              >
                {/* Item Icon Placeholder */}
                <div className="w-8 h-8 flex items-center justify-center">
                  {(item.type === "mainHand" || item.type === "offHand") && <Sword className="w-5 h-5 text-zinc-300" />}
                  {item.type === "helmet" && <Crown className="w-5 h-5 text-zinc-300" />}
                  {item.type === "chest" && <img src="/ui/slots/chest.svg" alt="chest" className="w-5 h-5" />}
                  {item.type === "pants" && <img src="/ui/slots/pants.svg" alt="pants" className="w-5 h-5" />}
                  {item.type === "gloves" && <img src="/ui/slots/gloves.svg" alt="gloves" className="w-5 h-5" />}
                  {item.type === "boots" && <img src="/ui/slots/boots.svg" alt="boots" className="w-5 h-5" />}
                  {(item.type === "necklace" ||
                    item.type === "earring1" ||
                    item.type === "earring2" ||
                    item.type === "ring1" ||
                    item.type === "ring2") && <Gem className="w-5 h-5 text-zinc-300" />}
                </div>
                {/* Level Badge */}
                <div className="absolute top-0.5 right-0.5 bg-zinc-950/90 rounded px-1 py-0.5">
                  <span className="text-[9px] font-bold text-amber-400">{item.level}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar (Fixed at bottom) */}
        {selectedItem && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 p-4">
            <div className="space-y-2">
              <div className="text-center">
                <p
                  className={`text-sm font-bold ${
                    selectedItem.rarity === "epic"
                      ? "text-purple-400"
                      : selectedItem.rarity === "rare"
                        ? "text-blue-400"
                        : selectedItem.rarity === "uncommon"
                          ? "text-green-400"
                          : "text-zinc-400"
                  }`}
                >
                  {selectedItem.name}
                </p>
                <p className="text-xs text-zinc-500">
                  Level {selectedItem.level} • {selectedItem.type}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEquip} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Equip
                </Button>
                <Button
                  onClick={handleSell}
                  variant="outline"
                  className="flex-1 border-amber-600 text-amber-500 hover:bg-amber-950/50 bg-transparent"
                >
                  <Coins className="w-4 h-4 mr-1" />
                  Sell
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Modal Dialog */}
        <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-[340px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Character Stats</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-950/50 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="font-medium">Health Points</span>
                </div>
                <span className="text-xl font-bold">{totalStats.hp}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-950/50 flex items-center justify-center">
                    <Swords className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="font-medium">Attack</span>
                </div>
                <span className="text-xl font-bold">{totalStats.attack}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-950/50 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="font-medium">Defense</span>
                </div>
                <span className="text-xl font-bold">{totalStats.defense}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
