/* 验证跨场跟随：重算、阻断冲突、成环、复制方案保留关系 */
import { analyzePlanFollows, detectConflicts, recalculatePlans, samplePlans } from '../src/data';
import { indexPlanCues } from '../src/data';

function clone<T>(v: T): T {
  return structuredClone(v);
}
function fmt(v: number | undefined) {
  return v?.toFixed(2);
}
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('✗ ' + msg);
    process.exitCode = 1;
  } else {
    console.log('✓ ' + msg);
  }
}

// ---------- 1. 示例方案：跨场收尾跟随正确接续 ----------
{
  const plans = recalculatePlans(clone(samplePlans));
  const main = plans.find((p) => p.id === 'plan-main')!;
  const s1 = main.scenes.find((s) => s.id === 'scene-1')!;
  const s2 = main.scenes.find((s) => s.id === 'scene-2')!;
  const s3 = main.scenes.find((s) => s.id === 'scene-3')!;
  const s4 = main.scenes.find((s) => s.id === 'scene-4')!;
  const q4 = s1.cues.find((c) => c.number === 'Q4')!;
  const q10 = s2.cues.find((c) => c.number === 'Q10')!;
  const q13 = s2.cues.find((c) => c.number === 'Q13')!;
  const q20 = s3.cues.find((c) => c.number === 'Q20')!;
  const q23 = s3.cues.find((c) => c.number === 'Q23')!;
  const q30 = s4.cues.find((c) => c.number === 'Q30')!;
  const q31 = s4.cues.find((c) => c.number === 'Q31')!;

  assert(q10.startTime === q4.endTime, `Q10 跨场接续 Q4 收尾：${fmt(q10.startTime)} === ${fmt(q4.endTime)}`);
  assert(q20.startTime === q13.endTime, `Q20 跨场接续 Q13 收尾：${fmt(q20.startTime)} === ${fmt(q13.endTime)}`);
  assert(q30.startTime === q23.endTime, `Q30 跨场接续 Q23 收尾：${fmt(q30.startTime)} === ${fmt(q23.endTime)}`);
  assert(q31.startTime === q30.endTime, `Q31 本场接续 Q30 收尾：${fmt(q31.startTime)} === ${fmt(q30.endTime)}`);
  assert(s2.startTime === s1.duration, `场次游标无缝接续：scene2.start=${fmt(s2.startTime)}`);

  const infos = analyzePlanFollows(main);
  assert(infos.get(q10.id)?.crossScene === true && !infos.get(q10.id)!.blocked, 'Q10 识别为有效跨场跟随');
  const mainConflicts = detectConflicts(plans).filter((c) => c.planId === 'plan-main' && c.type === 'follow-order');
  assert(mainConflicts.length === 0, '主方案无跟随阻断冲突，实际：' + mainConflicts.map((c) => c.message).join('；'));
}

// ---------- 2. 前场目标时间变长，后场自动重算 ----------
{
  const plans = recalculatePlans(clone(samplePlans));
  const main = plans.find((p) => p.id === 'plan-main')!;
  const q4 = main.scenes.find((s) => s.id === 'scene-1')!.cues.find((c) => c.number === 'Q4')!;
  const q10 = main.scenes.find((s) => s.id === 'scene-2')!.cues.find((c) => c.number === 'Q10')!;
  const before = q10.startTime!;
  q4.hold += 20;
  recalculatePlans(plans);
  assert(q10.startTime === before + 20, `前场 Q4 保持 +20s，后场 Q10 起点顺延：${before} -> ${fmt(q10.startTime)}`);
}

// ---------- 3. 前场参数/顺序变化沿跨场链向所有后续场次传导 ----------
{
  const plans = recalculatePlans(clone(samplePlans));
  const main = plans.find((p) => p.id === 'plan-main')!;
  const s1 = main.scenes.find((s) => s.id === 'scene-1')!;
  const s3 = main.scenes.find((s) => s.id === 'scene-3')!;
  const s4 = main.scenes.find((s) => s.id === 'scene-4')!;
  const q1 = s1.cues.find((c) => c.number === 'Q1')!;
  const q20 = s3.cues.find((c) => c.number === 'Q20')!;
  const q30 = s4.cues.find((c) => c.number === 'Q30')!;
  const q10 = main.scenes.find((s) => s.id === 'scene-2')!.cues.find((c) => c.number === 'Q10')!;
  const q20Before = q20.startTime!;
  const q30Before = q30.startTime!;
  q1.fadeIn += 10;
  recalculatePlans(plans);
  assert(q10.startTime === 99.5 + 10, `Q10（独白场首条）顺延 10s：${fmt(q10.startTime)}`);
  assert(q20.startTime === q20Before + 10, `Q20（群舞场跨场跟随）顺延 10s：${fmt(q20Before)} -> ${fmt(q20.startTime)}`);
  assert(q30.startTime === q30Before + 10, `Q30（终场跨场跟随）顺延 10s：${fmt(q30Before)} -> ${fmt(q30.startTime)}`);

  // 重排前场提示顺序：交换互不跟随的 Q3/Q4，跨场链不被打断；
  // 而把跟随者拖到目标前会由 forward 阻断单独检测（见第 5 项）。
  const fresh = recalculatePlans(clone(samplePlans));
  const freshMain = fresh.find((p) => p.id === 'plan-main')!;
  const freshS1 = freshMain.scenes.find((s) => s.id === 'scene-1')!;
  const q3 = freshS1.cues.find((c) => c.number === 'Q3')!;
  const q4 = freshS1.cues.find((c) => c.number === 'Q4')!;
  freshS1.cues = [freshS1.cues[0], freshS1.cues[1], q4, q3];
  const infos = analyzePlanFollows(freshMain);
  assert([...infos.values()].every((i) => !i.blocked), '交换互不跟随的提示后，所有跟随关系仍有效（无阻断）');
}

// ---------- 4. 目标被删除 -> 阻断 missing ----------
{
  const plans = recalculatePlans(clone(samplePlans));
  const main = plans.find((p) => p.id === 'plan-main')!;
  const s1 = main.scenes.find((s) => s.id === 'scene-1')!;
  s1.cues = s1.cues.filter((c) => c.number !== 'Q4');
  recalculatePlans(plans);
  const conflicts = detectConflicts(plans).filter((c) => c.planId === 'plan-main' && c.type === 'follow-order');
  const q10 = conflicts.find((c) => c.message.includes('Q10'));
  assert(Boolean(q10) && q10.severity === 'error', '删除 Q4 后 Q10 报告目标移走阻断：' + q10?.message);
  const infos = analyzePlanFollows(main);
  const info = [...infos.values()].find((i) => i.owner.number === 'Q10');
  assert(info?.blocked === true && info.reason === 'missing', 'analyzePlanFollows 标记 missing 阻断');
}

// ---------- 5. 目标跑到后面（同场 & 跨场）-> 阻断 forward ----------
{
  const plans = recalculatePlans(clone(samplePlans));
  const main = plans.find((p) => p.id === 'plan-main')!;
  const s2 = main.scenes.find((s) => s.id === 'scene-2')!;
  // Q11 原本跟随 Q10（前面），改为跟随同场排在后面的 Q13
  const q11 = s2.cues.find((c) => c.number === 'Q11')!;
  q11.followCueId = s2.cues.find((c) => c.number === 'Q13')!.id;
  // Q10 原本跨场跟随 scene-1 的 Q4，改为跟随 scene-3 的 Q23（后续场次）
  const q10 = s2.cues.find((c) => c.number === 'Q10')!;
  q10.followCueId = main.scenes.find((s) => s.id === 'scene-3')!.cues.find((c) => c.number === 'Q23')!.id;
  recalculatePlans(plans);
  const conflicts = detectConflicts(plans).filter((c) => c.planId === 'plan-main' && c.type === 'follow-order');
  const sameScene = conflicts.find((c) => c.message.includes('Q11'));
  const crossScene = conflicts.find((c) => c.message.includes('Q10'));
  assert(Boolean(sameScene) && sameScene.severity === 'error', '同场目标在后 -> 阻断：' + sameScene?.message);
  assert(Boolean(crossScene) && crossScene.message.includes('后续场次'), '跨场目标在后续场次 -> 阻断：' + crossScene?.message);
}

// ---------- 6. 成环（同场 & 跨场）-> 阻断 cycle ----------
{
  const plans = recalculatePlans(clone(samplePlans));
  const main = plans.find((p) => p.id === 'plan-main')!;
  const s1 = main.scenes.find((s) => s.id === 'scene-1')!;
  const s2 = main.scenes.find((s) => s.id === 'scene-2')!;
  const q2 = s1.cues.find((c) => c.number === 'Q2')!;
  const q10 = s2.cues.find((c) => c.number === 'Q10')!;
  const q4 = s1.cues.find((c) => c.number === 'Q4')!;
  // Q2 -> Q3 -> Q2 同场环
  const q3 = s1.cues.find((c) => c.number === 'Q3')!;
  q2.followCueId = q3.id;
  // Q4 -> Q10 -> Q4 跨场环
  q4.followCueId = q10.id;
  recalculatePlans(plans);
  const conflicts = detectConflicts(plans).filter((c) => c.planId === 'plan-main' && c.type === 'follow-order');
  const cycleMsgs = conflicts.map((c) => c.message);
  assert(cycleMsgs.some((m) => m.includes('Q2') && m.includes('成环')), '同场成环 Q2 报阻断：' + cycleMsgs.find((m) => m.includes('Q2')));
  assert(cycleMsgs.some((m) => m.includes('Q10') && m.includes('成环')), '跨场成环 Q10 报阻断：' + cycleMsgs.find((m) => m.includes('Q10')));
  assert(cycleMsgs.every((m) => /Q\d+ →/.test(m)), '成环信息列出链条：' + cycleMsgs.join(' | '));
}

// ---------- 7. 复制方案：跨场关系 id 重写后仍解析 ----------
{
  const plans = recalculatePlans(clone(samplePlans));
  const source = plans.find((p) => p.id === 'plan-main')!;
  const id = 'plan-copy-x';
  const copy = structuredClone(source);
  copy.id = id;
  copy.scenes.forEach((scene) => {
    scene.id = `${id}-${scene.id}`;
    scene.cues.forEach((cue) => {
      cue.id = `${id}-${cue.id}`;
      cue.followCueId = cue.followCueId ? `${id}-${cue.followCueId}` : '';
    });
  });
  plans.push(copy);
  recalculatePlans(plans);
  const conflicts = detectConflicts(plans).filter((c) => c.planId === id && c.type === 'follow-order');
  assert(conflicts.length === 0, '复制方案后跨场跟随全部保留且无阻断：' + conflicts.map((c) => c.message).join('；'));
  const copiedS2 = copy.scenes.find((s) => s.order === 2)!;
  const copiedQ10 = copiedS2.cues.find((c) => c.number === 'Q10')!;
  const { cueById } = indexPlanCues(copy);
  assert(Boolean(cueById.get(copiedQ10.followCueId)), '复制后 followCueId 能在副本内解析');
  assert(cueById.get(copiedQ10.followCueId)?.number === 'Q4', '复制后跨场目标仍为 Q4');
}

// ---------- 8. 旧数据（本场选择器语义）+ 游离 id 不崩溃 ----------
{
  const plans = recalculatePlans(clone(samplePlans));
  const main = plans.find((p) => p.id === 'plan-main')!;
  main.scenes[0].cues[0].followCueId = 'cue-does-not-exist';
  recalculatePlans(plans);
  const conflicts = detectConflicts(plans);
  assert(conflicts.some((c) => c.type === 'follow-order' && c.severity === 'error'), '游离 followCueId 报阻断而非崩溃');
}
