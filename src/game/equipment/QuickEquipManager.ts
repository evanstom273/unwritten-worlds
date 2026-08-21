import { QuickEquipChannel } from './QuickEquipChannel';
import {
	EMPTY_QUICK_EQUIP_ENTRY,
	type QuickEquipEntry,
} from './QuickEquipEntry';
import { PROTOTYPE_LOADOUT } from './prototypeLoadout';

export interface QuickEquipChannelState {
	readonly channel: QuickEquipChannel;
	readonly selectedIndex: number;
	readonly selectedEntry: QuickEquipEntry;
	readonly entryCount: number;
}

export interface QuickEquipSnapshot {
	readonly channels: Readonly<Record<QuickEquipChannel, QuickEquipChannelState>>;
	readonly lastChangedChannel: QuickEquipChannel | null;
	readonly lastChangedAtMs: number;
}

export class QuickEquipManager {
	private readonly entries = new Map<QuickEquipChannel, QuickEquipEntry[]>();
	private readonly selectedIndex = new Map<QuickEquipChannel, number>();
	private lastChangedChannel: QuickEquipChannel | null = null;
	private lastChangedAtMs = 0;

	constructor() {
		for (const channel of Object.values(QuickEquipChannel)) {
			this.entries.set(channel, [...PROTOTYPE_LOADOUT[channel]]);
			this.selectedIndex.set(channel, 0);
		}
	}

	cycle(channel: QuickEquipChannel, direction: 1 | -1 = 1): void {
		const channelEntries = this.entries.get(channel) ?? [];
		if (channelEntries.length === 0) {
			return;
		}

		const current = this.selectedIndex.get(channel) ?? 0;
		const next = (current + direction + channelEntries.length) % channelEntries.length;
		this.selectedIndex.set(channel, next);
		this.lastChangedChannel = channel;
		this.lastChangedAtMs = performance.now();
	}

	getSelectedEntry(channel: QuickEquipChannel): QuickEquipEntry {
		const channelEntries = this.entries.get(channel) ?? [];
		if (channelEntries.length === 0) {
			return EMPTY_QUICK_EQUIP_ENTRY;
		}

		const index = this.selectedIndex.get(channel) ?? 0;
		return channelEntries[index] ?? EMPTY_QUICK_EQUIP_ENTRY;
	}

	getSnapshot(): QuickEquipSnapshot {
		const channels = {} as Record<QuickEquipChannel, QuickEquipChannelState>;

		for (const channel of Object.values(QuickEquipChannel)) {
			const channelEntries = this.entries.get(channel) ?? [];
			const index = this.selectedIndex.get(channel) ?? 0;
			channels[channel] = {
				channel,
				selectedIndex: index,
				selectedEntry: this.getSelectedEntry(channel),
				entryCount: channelEntries.length,
			};
		}

		return {
			channels,
			lastChangedChannel: this.lastChangedChannel,
			lastChangedAtMs: this.lastChangedAtMs,
		};
	}
}
