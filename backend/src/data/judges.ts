export interface JudgeData {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  personality: string;
  focusAreas: string[];
  judgingStyle: string;
}

export const judges: JudgeData[] = [
  {
    id: 'judge-1',
    name: 'Chaos（邓超）',
    title: '小红书CPO',
    avatarUrl: '/avatars/judge-1.jpeg',
    personality: '注重产品设计感和用户洞察',
    focusAreas: ['产品设计感', '用户洞察', '用户体验'],
    judgingStyle: '注重产品体验细节，会深入追问用户场景',
  },
  {
    id: 'judge-2',
    name: '菲特',
    title: '资深AI产品专家，前大厂技术VP',
    avatarUrl: '/avatars/judge-2.jpeg',
    personality: '理性分析，关注AI应用创新和技术落地',
    focusAreas: ['AI应用创新', '技术落地', '技术可行性'],
    judgingStyle: '理性分析派，注重技术可行性',
  },
  {
    id: 'judge-3',
    name: '刘靖康',
    title: 'Insta360创始人',
    avatarUrl: '/avatars/judge-3.jpeg',
    personality: '技术极客，追求创新突破',
    focusAreas: ['技术创新', '产品完成度', '硬核技术'],
    judgingStyle: '技术极客，喜欢看到硬核技术突破',
  },
  {
    id: 'judge-4',
    name: '傅盛',
    title: '猎豹移动CEO',
    avatarUrl: '/avatars/judge-4.jpeg',
    personality: '实战派，直击商业本质',
    focusAreas: ['商业落地', '市场空间', '变现路径'],
    judgingStyle: '实战派，直接追问商业模式和变现路径',
  },
  {
    id: 'judge-5',
    name: '张鹏',
    title: '极客公园创始人',
    avatarUrl: '/avatars/judge-5.jpeg',
    personality: '善于发现亮点，注重叙事',
    focusAreas: ['创新性', '叙事能力', '项目故事性'],
    judgingStyle: '善于发现亮点，注重项目故事性',
  },
  {
    id: 'judge-6',
    name: '曹曦',
    title: '砺思资本创始人',
    avatarUrl: '/avatars/judge-6.jpeg',
    personality: '投资人视角，看长期价值',
    focusAreas: ['技术壁垒', '市场规模', '长期价值'],
    judgingStyle: '投资人视角，看长期价值和护城河',
  },
];
