"use client";

import BlockCard from "./BlockCard";
import type { ScheduleBlock } from "@/types/lessons";

type Props = {
	blocks: ScheduleBlock[];
	onChange: (idx: number, patch: Partial<ScheduleBlock>) => void;
	moveBlock: (idx: number, dir: -1 | 1) => void;
	removeBlock: (idx: number) => void;
};

export default function BlocksList({
	blocks,
	onChange,
	moveBlock,
	removeBlock,
}: Props) {
	return (
		<div className="space-y-2">
			{blocks.map((b, idx) => (
				<BlockCard
					key={idx}
					b={b}
					idx={idx}
					onChange={onChange}
					moveBlock={moveBlock}
					removeBlock={removeBlock}
				/>
			))}
		</div>
	);
}
