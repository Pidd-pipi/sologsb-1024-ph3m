import type { Cue, CueConflict, LightingPlan, Scene, UserRole } from './types';

const FIXED_TIME = '2026-09-25T02:00:00.000Z';

export const roleLabels: Record<UserRole, string> = {
  designer: '灯光设计',
  programmer: '编程执行',
  'stage-manager': '舞台监督',
  readonly: '只读查看'
};

export const statusLabels = {
  draft: '未完成',
  ready: '待执行',
  confirmed: '已确认'
} as const;

export const colorPresets = [
  { name: '黑场', value: '#000000' },
  { name: '深蓝', value: '#1D4ED8' },
  { name: '天青', value: '#0EA5E9' },
  { name: '暖白', value: '#FFF1C7' },
  { name: '琥珀', value: '#F59E0B' },
  { name: '品红', value: '#D946EF' },
  { name: '舞台红', value: '#DC2626' },
  { name: '松绿', value: '#059669' },
  { name: '薰衣草', value: '#8B5CF6' }
];

let cueSequence = 0;

function cue(
  number: string,
  label: string,
  position: string,
  channel: string,
  color: string,
  colorHex: string,
  brightness: number,
  fadeIn: number,
  hold: number,
  fadeOut: number,
  followCueId = '',
  targetNote = '',
  notes = '',
  status: Cue['status'] = 'ready'
): Cue {
  cueSequence += 1;
  return {
    id: `cue-${cueSequence}`,
    number,
    label,
    position,
    channel,
    color,
    colorHex,
    brightness,
    fadeIn,
    hold,
    fadeOut,
    followCueId,
    targetNote,
    notes,
    status
  };
}

function scene(id: string, name: string, order: number, frozen: boolean, cues: Cue[]): Scene {
  return { id, name, order, frozen, cues };
}

const mainPlan: LightingPlan = {
  id: 'plan-main',
  name: '主舞台方案',
  description: '完整剧院版本，保留大面积侧光与低角度造型。',
  updatedAt: FIXED_TIME,
  scenes: [
    scene('scene-1', '序章 · 入梦', 1, false, [
      cue('Q1', '观众席暗场', '全台', 'Grand Master', '黑场', '#000000', 0, 4, 6, 3, '', '场灯降至 10%', '开演提示与场灯联动。', 'confirmed'),
      cue('Q2', '月幕初升', '天幕', 'Cyc 1', '深蓝', '#1D4ED8', 62, 8, 18, 6, 'cue-1', '月幕形成冷色底', '天幕均匀，避免中心热斑。'),
      cue('Q3', '人物侧光', '左前区', 'FOH L 3', '暖白', '#FFF1C7', 74, 2.5, 22, 5, 'cue-2', '演员入画', '为独白人物补面，保留右侧阴影。', 'ready'),
      cue('Q4', '雾门显现', '后区', 'Beam 2', '天青', '#0EA5E9', 58, 5, 12, 8, '', '雾机启动后可见', '通道尚未实测。', 'draft')
    ]),
    scene('scene-2', '独白 · 失语', 2, false, [
      cue('Q10', '独白收束', '前区', 'FOH 1-4', '琥珀', '#F59E0B', 46, 7, 32, 9, '', '演员坐于长椅', '压低背景，仅保留边光。'),
      cue('Q11', '呼吸变化', '前区', 'FOH L 3', '暖白', '#FFF1C7', 72, 3, 8, 3, 'cue-5', '吸气点触发', '与台词“我听见”同步。', 'ready'),
      cue('Q12', '影子分裂', '侧幕', 'Side 5', '品红', '#D946EF', 54, 2, 15, 7, 'cue-11', '两次呼吸后', '需要检查侧幕遮挡。', 'draft'),
      cue('Q13', '冷色侵入', '全台', 'Grand Master', '深蓝', '#1D4ED8', 38, 10, 24, 12, '', '音乐低频进入', '与 Q12 通道存在叠光风险。')
    ]),
    scene('scene-3', '群舞 · 潮汐', 3, false, [
      cue('Q20', '群舞起光', '后区', 'Dance 1-6', '松绿', '#059669', 68, 2, 18, 4, '', '第一组舞者进入', '两侧亮度需平衡。', 'ready'),
      cue('Q21', '潮线推移', '侧区', 'Side 1-4', '天青', '#0EA5E9', 60, 5, 16, 5, 'cue-4', '第二组越过中线', '跟随舞者视线，跨场承接序章 Q4「雾门显现」收尾。'),
      cue('Q22', '高点爆闪', '全台', 'Grand Master', '暖白', '#FFF1C7', 92, 0.3, 0.8, 8, 'cue-10', '定音鼓重音', '确认频闪安全。', 'draft'),
      cue('Q23', '潮退', '后区', 'Dance 1-6', '深蓝', '#1D4ED8', 26, 12, 28, 14, '', '音乐进入尾奏', '')
    ]),
    scene('scene-4', '终场 · 归岸', 4, true, [
      cue('Q30', '归岸定点', '前区', 'FOH 1-2', '暖白', '#FFF1C7', 48, 8, 26, 10, '', '演员回到长椅', '已与导演确认。', 'confirmed'),
      cue('Q31', '星空落幕', '天幕', 'Cyc 2', '薰衣草', '#8B5CF6', 34, 6, 36, 16, 'cue-12', '演员抬头后', '冻结场次，保留最终状态。', 'confirmed')
    ])
  ]
};

const coolPlan: LightingPlan = {
  id: 'plan-cool',
  name: '冷调实验方案',
  description: '减少正面光，以侧逆光和天幕色块建立空间。',
  updatedAt: FIXED_TIME,
  scenes: [
    scene('cool-scene-1', '序章 · 入梦（冷调）', 1, false, [
      cue('C1', '冷场', '全台', 'Grand Master', '深蓝', '#1D4ED8', 14, 5, 8, 5, '', '场灯渐暗', '冷调版本无全黑场。', 'ready'),
      cue('C2', '逆光月幕', '天幕', 'Cyc 1', '天青', '#0EA5E9', 72, 10, 18, 8, 'cue-18', '月幕升起', '跨场跟随独白场 C11，与对方互指形成跨场跟随环（示例阻断冲突）。')
    ]),
    scene('cool-scene-2', '独白 · 失语（冷调）', 2, false, [
      cue('C10', '侧逆光', '左后', 'Beam 1', '薰衣草', '#8B5CF6', 58, 4, 28, 10, '', '演员背向观众', ''),
      cue('C11', '边缘呼吸', '右侧', 'Side 5', '品红', '#D946EF', 42, 1, 7, 4, 'cue-16', '台词停顿', '跨场跟随序章场 C2，两场均声明跟随对方形成跨场跟随环（示例阻断冲突）。')
    ])
  ]
};

const tourPlan: LightingPlan = {
  id: 'plan-tour',
  name: '巡演简约方案',
  description: '适配中小剧场，合并天幕和侧光通道。',
  updatedAt: FIXED_TIME,
  scenes: [
    scene('tour-scene-1', '序章 · 入梦', 1, false, [
      cue('T1', '场灯收束', '全台', 'Master', '暖白', '#FFF1C7', 18, 3, 5, 4, '', '开场', '巡演设备清单已确认。', 'ready'),
      cue('T2', '蓝色天幕', '天幕', 'Wash A', '深蓝', '#1D4ED8', 55, 6, 24, 8, 'cue-15', '演员入场', '跟随目标属于其他方案，示例“前场提示被移走”阻断冲突。')
    ]),
    scene('tour-scene-2', '群舞 · 潮汐', 2, false, [
      cue('T10', '侧光推进', '后区', 'Wash B', '松绿', '#059669', 64, 2, 20, 5, '', '群舞起点', ''),
      cue('T11', '潮点', '全台', 'Master', '琥珀', '#F59E0B', 84, 1, 2, 7, 'cue-16', '鼓点', '')
    ])
  ]
};

export const samplePlans = [mainPlan, coolPlan, tourPlan];

/**
 * 一条提示及其在同方案内的解析结果。
 * sceneId 为空表示跟随目标在整个方案中都找不到（可能被删除、移走或属于其他方案）。
 */
export interface ResolvedCue {
  cue: Cue;
  scene: Scene;
  sceneId: string;
}

export interface FollowAnalysis {
  /** 全剧提示索引：cueId -> 提示与其所属场次 */
  index: Map<string, ResolvedCue>;
  /** 全局顺序序号（按场次 order、场内需提示数组顺序） */
  orderIndex: Map<string, number>;
  /** 陷入跟随环的提示 id 集合 */
  cycleCueIds: Set<string>;
  scenes: Scene[];
}

/** 按场次顺序、再按场内数组顺序展平方案。 */
export function flattenPlan(plan: LightingPlan): ResolvedCue[] {
  return [...plan.scenes]
    .sort((a, b) => a.order - b.order)
    .flatMap((scene) => scene.cues.map((cue) => ({ cue, scene, sceneId: scene.id })));
}

/** 在方案范围内解析跟随目标；支持跨场次，找不到返回 undefined。 */
export function findFollowTarget(plan: LightingPlan, cueId: string): ResolvedCue | undefined {
  if (!cueId) return undefined;
  for (const scene of plan.scenes) {
    const cue = scene.cues.find((candidate) => candidate.id === cueId);
    if (cue) return { cue, scene, sceneId: scene.id };
  }
  return undefined;
}

/**
 * 建立全剧跟随关系分析：索引、全局顺序与成环集合。
 * 只有指向方案内真实存在提示的跟随边才会参与成环判断。
 */
export function analyzeFollows(plan: LightingPlan): FollowAnalysis {
  const ordered = flattenPlan(plan);
  const index = new Map<string, ResolvedCue>();
  const orderIndex = new Map<string, number>();
  ordered.forEach((entry, position) => {
    index.set(entry.cue.id, entry);
    orderIndex.set(entry.cue.id, position);
  });

  // 迭代式 DFS：每个节点至多一条跟随出边，沿链染色即可精确收集环上节点，
  // 环的上游链不会被误判（如 A→B→C→B 只标记 B、C）。
  const cycleCueIds = new Set<string>();
  const color = new Map<string, 0 | 1>(); // 0=当前路径上，1=已探查完
  for (const start of ordered) {
    if (color.has(start.cue.id)) continue;
    const path: string[] = [];
    const positionInPath = new Map<string, number>();
    let current: string | undefined = start.cue.id;
    while (current !== undefined) {
      const mark = color.get(current);
      if (mark === 1) break; // 已探查完的链，不可能再构成新环
      if (mark === 0) {
        const at = positionInPath.get(current) ?? 0;
        for (let i = at; i < path.length; i += 1) cycleCueIds.add(path[i]);
        break;
      }
      color.set(current, 0);
      positionInPath.set(current, path.length);
      path.push(current);
      const targetId: string | undefined = index.get(current)?.cue.followCueId;
      current = targetId && index.has(targetId) ? targetId : undefined;
    }
    path.forEach((id) => color.set(id, 1));
  }

  return { index, orderIndex, cycleCueIds, scenes: ordered.map((entry) => entry.scene).filter((scene, i, arr) => arr.indexOf(scene) === i) };
}

/**
 * 全剧时间重算：按场次顺序与场内顺序单遍调度。
 * - 无跟随或跟随边不可用时，提示在本场上一条之后依次起光；
 * - 跟随目标位于本方案更靠前位置（含前序场次）时，在目标结束时起光，
 *   前场提示的时间或顺序变化会通过目标 endTime 与场次游标自然传导，后续场次自动续接重算；
 * - 成环或目标位于自身之后的跟随边不可用于调度（由冲突面板报阻断）。
 */
export function recalculatePlans(plans: LightingPlan[]) {
  for (const plan of plans) {
    const analysis = analyzeFollows(plan);
    const scenes = [...plan.scenes].sort((a, b) => a.order - b.order);
    let absoluteCursor = 0;
    for (const scene of scenes) {
      scene.startTime = absoluteCursor;
      let sceneCursor = absoluteCursor;
      for (const item of scene.cues) {
        const duration = Math.max(0.1, item.fadeIn + item.hold + item.fadeOut);
        item.duration = Number(duration.toFixed(2));
        const targetId = item.followCueId;
        const target = targetId ? analysis.index.get(targetId) : undefined;
        const targetIsEarlier =
          target !== undefined && (analysis.orderIndex.get(target.cue.id) ?? 0) < (analysis.orderIndex.get(item.id) ?? 0);
        const edgeUsable = targetIsEarlier && !analysis.cycleCueIds.has(item.id);
        const followTime = edgeUsable && target ? target.cue.endTime ?? sceneCursor : sceneCursor;
        item.startTime = Number(Math.max(sceneCursor, followTime).toFixed(2));
        item.endTime = Number((item.startTime + duration).toFixed(2));
        sceneCursor = Math.max(sceneCursor, item.endTime);
      }
      scene.duration = Number(Math.max(0, sceneCursor - absoluteCursor).toFixed(2));
      absoluteCursor = sceneCursor;
    }
  }
  return plans;
}

function followChainText(analysis: FollowAnalysis, startId: string): string {
  const labels: string[] = [];
  const seen = new Set<string>();
  let id: string | undefined = startId;
  while (id && !seen.has(id)) {
    seen.add(id);
    const entry = analysis.index.get(id);
    if (!entry) break;
    labels.push(entry.cue.number);
    id = entry.cue.followCueId || undefined;
  }
  if (id && seen.has(id)) labels.push(analysis.index.get(id)?.cue.number ?? id);
  return labels.join(' → ');
}

export function detectConflicts(plans: LightingPlan[]): CueConflict[] {
  const conflicts: CueConflict[] = [];
  for (const plan of plans) {
    const analysis = analyzeFollows(plan);
    for (const scene of plan.scenes) {
      const byChannel = new Map<string, Cue[]>();
      const positions = new Map<string, Cue[]>();
      for (const item of scene.cues) {
        const errors: string[] = [];
        if (!item.channel.trim()) errors.push('缺少通道');
        if (!item.position.trim()) errors.push('缺少灯位');
        if (!item.label.trim()) errors.push('缺少提示名称');
        if (item.brightness < 0 || item.brightness > 100) errors.push('亮度应在 0–100 之间');
        if (item.fadeIn < 0 || item.hold < 0 || item.fadeOut < 0) errors.push('渐变或保持时间不能为负');
        if (errors.length) {
          conflicts.push({
            id: `${plan.id}-${scene.id}-${item.id}-missing`,
            planId: plan.id,
            sceneId: scene.id,
            cueId: item.id,
            severity: 'error',
            type: 'missing-data',
            message: `${item.number} ${errors.join('、')}`
          });
        }

        // 跟随关系阻断冲突：成环 > 目标移走/缺失 > 目标跑到了后面（含跨场次）。
        if (item.followCueId) {
          const target = analysis.index.get(item.followCueId);
          if (analysis.cycleCueIds.has(item.id)) {
            conflicts.push({
              id: `${plan.id}-${scene.id}-${item.id}-follow-cycle`,
              planId: plan.id,
              sceneId: scene.id,
              cueId: item.id,
              severity: 'error',
              type: 'follow-cycle',
              message: `${item.number} 的跟随关系成环（${followChainText(analysis, item.id)}），无法确定起光时间，请解除其中一条跟随`
            });
          } else if (!target) {
            conflicts.push({
              id: `${plan.id}-${scene.id}-${item.id}-follow`,
              planId: plan.id,
              sceneId: scene.id,
              cueId: item.id,
              severity: 'error',
              type: 'follow-order',
              message: `${item.number} 的跟随提示已被移走或不属于本方案，跨场跟随链已阻断`
            });
          } else {
            const ownOrder = analysis.orderIndex.get(item.id) ?? 0;
            const targetOrder = analysis.orderIndex.get(target.cue.id) ?? 0;
            if (targetOrder >= ownOrder) {
              const crossScene = target.sceneId !== scene.id;
              conflicts.push({
                id: `${plan.id}-${scene.id}-${item.id}-follow-order`,
                planId: plan.id,
                sceneId: scene.id,
                cueId: item.id,
                severity: 'error',
                type: 'follow-order',
                message: crossScene
                  ? `${item.number} 跟随的 ${target.cue.number} 在后面的场次「${target.scene.name}」，跨场跟随只能承接前序场次`
                  : `${item.number} 的跟随目标 ${target.cue.number} 排在它后面，无法跟随一个尚未执行的提示`
              });
            }
          }
        }
      }

      const sorted = [...scene.cues].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
      for (const item of sorted) {
        const previous = byChannel.get(item.channel)?.at(-1);
        if (previous && (item.startTime ?? 0) < (previous.endTime ?? 0) - 0.01) {
          conflicts.push({
            id: `${plan.id}-${scene.id}-${item.id}-overlap`,
            planId: plan.id,
            sceneId: scene.id,
            cueId: item.id,
            severity: 'warning',
            type: 'channel-overlap',
            message: `${previous.number} 与 ${item.number} 在同通道 ${item.channel} 叠光`
          });
        }
        byChannel.set(item.channel, [...(byChannel.get(item.channel) ?? []), item]);
        positions.set(item.position, [...(positions.get(item.position) ?? []), item]);
      }

      for (const [position, items] of positions) {
        if (items.length > 1 && position !== '全台' && position !== '天幕') {
          conflicts.push({
            id: `${plan.id}-${scene.id}-${position}-duplicate`,
            planId: plan.id,
            sceneId: scene.id,
            cueId: items[1].id,
            severity: 'warning',
            type: 'duplicate-position',
            message: `${position} 被多个提示使用，请确认是否为有意的分区叠光`
          });
        }
      }
    }
  }
  return conflicts;
}
