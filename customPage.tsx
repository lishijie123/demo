import React, { useState, useEffect, useRef } from 'react';
import {
  Form,
  Input,
  Button,
  Dialog,
  TextArea,
  DateTimePicker,
  Selector,
  Select,
  Slider,
  Stepper,
  Collapse,
  FileUpload,
  Download,
  Cascader,
  Popup,
  Toast,
  Reference,
  Checkbox,
  ActionSheet,
  Switch
} from '@seeyon/mui';
import SeasonalSet from './components/periodSetting';
import { useToggle } from 'ahooks'
// import { SchedulerMobileSelf } from '@seeyon/mbiz-scheduler';
import styles from './customPage.module.less';
import moment from 'dayjs';
import { SyIcon, getCurrentUser ,  CloseWindow, i18n } from '@seeyon/global';
import {
  meetingEntity,
  meetingDetails,
  videoMeetingDetails,
  filterCondition,
  meetingMap,
  weekMap,
  filterNullValue,
  parseUrl,
  judgeRepeatPeople,
  compareTime,
  getDefaultTime,
  i18nSelf,
  isJSONStr,
} from './config';
import {
  getMeetings,
  getMeetingRoomsByIds,
  checkConflictsAsync,
  checkWhetherOccupiedAsync,
  checkConsistentTimeAsync,
  resolutionMeetingVenueAsync,
  sendMeetingAsync,
  saveReadyMeetingAsync,
  getMeetingDetailAsync,
  checkUserConflictsAsync,
  getVideoMeetingRoomPlugin,
  MeetingTimePeopleAsync,
} from './service';
import { useMetadata } from '../../metadata';
import RuntimeCmp from './components/content';
import RemoteComponent from '@seeyon/biz-remote-component';
import { sendMessageCard, getTeamMember } from './components/messageCard';
interface TeamInfo {
  targetId: string;
  targetName: string;
  targetType:string;
}
interface ZqixingType {
intervalDays?:number;
repeatEndTime?:number;
repeatMode?:number;
repeatStrategy?:number;
repeatability?:boolean;
}
// import icon_png from './assests/icon.png';
const SchedulerMobileSelf = React.lazy(() =>
  import('@seeyon/mbiz-scheduler').then((res) => ({
    default: res.SchedulerMobileSelf,
  })),
);
const OrgSelector = React.lazy(() => import('@seeyon/mbiz-org-selector'));

const Index = () => {
  let startTimeOrigin = moment(Number(parseUrl()?.startTime)).valueOf() || getDefaultTime('start');
  let endTimeOrigin = moment(Number(parseUrl()?.endTime)).valueOf() || getDefaultTime('end');
  const handleRef = useRef(null);
  const { start_date, end_date, contentName } = meetingEntity?.attributes;
  const [checked, { toggle: toggleChecked }] = useToggle(false)
  const [loading, { toggle }] = useToggle(true)
  const currentUser: any = getCurrentUser() || {};
  const [title, setTitle] = useState<string>(''); // 会议主题
  const [startTime, setStartTime] = useState<string | number>(startTimeOrigin); // 会议开始时间
  const [endTime, setEndTime] = useState<string | number>(endTimeOrigin); // 会议结束时间
  const [visible, setVisible] = useState<number>(0); // 1: 参会人 2:会议室申请
  const [roomStr , setRoomStr] = useState('')
  const [meetingRoom, setMeetingRoom] = useState<any[]>(
    parseUrl().huiyixiangqing
      ? JSON.parse(window.decodeURIComponent(parseUrl().huiyixiangqing))
      : [],
  ); // 会议室
  const [videoRoom, setVideoRoom] = useState<any[]>([]); // 视频会议室
  const [placeChoose, setPlaceChoose] = useState<string>(''); // 记录当前是会议室还是已申请会议室
  const [backfillMetting, setBackfillMetting] = useState<any[]>(
    parseUrl().huiyixiangqing
      ? JSON.parse(window.decodeURIComponent(parseUrl().huiyixiangqing))
      : [],
  ); // 选择完会议室回显
  const [videoBackfillMetting, setVideoBackfillMetting] = useState<any[]>([]); // 选择完会议室回显
  const [emceeId, setEmceeId] = useState<any[]>([
    { id: currentUser?.userId, name: currentUser?.userName },
  ]); // 主持人
  const [recorderId, setRecorderId] = useState<any[]>([
    { id: currentUser?.userId, name: currentUser?.userName },
  ]); // 记录人
  const [impart, setImpart] = useState<any[]>([]); // 告知人
  const [selectPeople, setSelectPeople] = useState<any[]>([]); // 参会人
  const [remindTime, setRemindTime] = useState<any[]>(['FIFTEEN']); // 提醒时间
  const [remindTime1 , setRemindTime1] = useState(['不提醒'])
  const [seasonal, setSeasonal] = useState<any>({
    repeatMode: 0,
    repeatEndTime: '',
    repeatability: false,
  });
  const [article, setArticle] = useState<any[]>([]); // 会议用品
  const [meetingCategory, setMeetingCategory] = useState<any[]>([]); // 会议类别
  const [contentKey, setContentKey] = useState<string>(''); // 正文key
  const [contentCont, setContentCont] = useState<any>(); // 正文内容
  const [isApplyAllMeetings, setIsApplyAllMeetings] = useState<boolean>(false); // 是否所有周期性会议生效
  const [zqxbyzd, setZqxbyzd] = useState<string>('0'); // 是否是周期性
  const [id, setId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [deleteFileList, setDeleteFileList] = useState<any[]>([]);
  const [tipVisible, SetTipVisible] = useState<string[]>([]);
  const [editData, setEditData] = useState<{ [prop: string]: any }>({}); //会议详情
  const [Reminder , setReminder] = useState<boolean>(false)
  const [hasVideoRoom , setHasVideoRoom] = useState<any>({})
  const [valueKey , setValueKey] = useState(0)
  //团队协作
  const [isFromM5, setIsFromM5] = useState(false); //是否来源于M5
  const [targetId , setTargetId] = useState('')
  const [targetType , setTargetType] = useState('')
  const [systemInfo, setSystemInfo] = useState<any>({});
  const hiddenData = {
    meetingStatus: '', // 会议状态
    applicant: currentUser.userId, // 发起人
    // department: currentUser.orgId, // 发起人部门
    appliedRoom:
      placeChoose === 'hasSelect' ? meetingRoom.map((item) => item?.roomID).join(',') : '', // 已申请会议室id
    roomID: meetingRoom.map((item) => item?.roomID).join(',') || '', // 会议室ID
    videoRoomID: videoRoom.map((item) => item?.roomID).join(',') || '0', // 视频会议室ID
    huiyixiangqing: JSON.stringify(
      meetingRoom.map((item) => {
        return {
          startDate: item.startTime,
          endDate: item.endTime,
          roomPlace: item.roomName,
          roomId: item.roomID,
        };
      }),
    ), // 占用详情，前端用
    hyddyysjstfh: meetingRoom
      .map(
        (item) =>
          `${item?.roomName}(${moment(Number(item?.startTime)).format('YYYY-MM-DD HH:mm')}-${moment(
            Number(item?.endTime),
          ).format('YYYY-MM-DD HH:mm')})`,
      )
      .join(','),
    // 后端需要此字段解析会议室情况
    shipinhuiyixiangqing: JSON.stringify(
      videoRoom.map((item) => {
        return {
          startDate: item.startTime,
          endDate: item.endTime,
          roomPlace: item.roomName,
          roomId: item.roomID,
        };
      }),
    ), // 占用详情
    isConsistent: true, // 时间是否一致
    zqxbyzd: '', // 周期性备用字段
  };

  const handleUploadChange = (data: any) => {
    let newList = data?.fileList?.map((item: any) => {
      return {
        id: item?.uid || item?.id,
        fileName: item?.name || item?.fileName,
        fileSize: item?.size || item?.fileSize,
        storageKey: item?.storageKey,
      };
    });
    let finalList = [...fileList, ...newList];
    let newSet = [...new Set(finalList.map((item: any) => item?.id))];
    setFileList(newSet.map((item: any) => finalList.find((item_l: any) => item_l?.id === item)));
  };
  const getTeamInfo = () => {
    return new Promise<TeamInfo>((resovle, reject) => {
      if (window?.jsSdk?.canIuse('team.getTeamContext')) {
       (window as any)?.jsSdk?.team?.getTeamContext(({ targetId, targetName, targetType }: TeamInfo) => {
          resovle({ targetId, targetName, targetType });
        });
      } else {
        reject('unsupported');
      }
    });
  };
    getTeamInfo().then((info) => {
      setTargetId(info.targetId);
      setTargetType(info.targetType)
    });


  useEffect(() => {
    let obj:ZqixingType = {}
    obj.intervalDays = editData?.intervalDays
    obj.repeatEndTime = editData?.repeatEndTime
    obj.repeatMode = editData?.repeatMode
    obj.repeatStrategy = editData?.repeatStrategy
    obj.repeatability = editData?.repeatability
    let obj2:ZqixingType  = {}
    obj2.intervalDays = seasonal?.intervalDays
    obj2.repeatEndTime = seasonal?.repeatEndTime
    obj2.repeatMode = seasonal?.repeatMode
    obj2.repeatStrategy = seasonal?.repeatStrategy
    obj2.repeatability = seasonal?.repeatability
    setIsApplyAllMeetings(!(obj?.intervalDays == obj2?.intervalDays && obj?.repeatEndTime == obj2?.repeatEndTime && obj?.repeatMode == obj2?.repeatMode  &&  obj?.repeatStrategy ==  obj2?.repeatStrategy && obj?.repeatability ==  obj2?.repeatability))
  },[seasonal,editData])
  useEffect(() => {
   if(!isApplyAllMeetings){
   seasonal.intervalDays = editData?.intervalDays
   seasonal.repeatEndTime = editData?.repeatEndTime
   seasonal.repeatMode = editData?.repeatMode
   seasonal.repeatStrategy = editData?.repeatStrategy
   seasonal.repeatability = editData?.repeatability
   }
  },[isApplyAllMeetings])
 console.log(isApplyAllMeetings,"------isApplyAllMeetings-----------");
 
  // 删除附件
  const handleRemove = (file: any, romveFile: any) => {
    let fileListBridge = file?.map((item: any) => {
      return {
        id: item?.uid || item?.id,
        fileName: item?.name || item?.fileName,
        fileSize: item?.size || item?.fileSize,
        storageKey: item?.storageKey,
      };
    });
    setDeleteFileList((deleteFileList) => [...deleteFileList, romveFile]);
    setFileList(fileListBridge);
  };

  /**
   * 会议室申请控件逻辑处理
   */
  const chooseTimeQuantum = (value: any[], sign: string) => {
    setBackfillMetting(value);
    setStartTime(Math.min(...value.map((item) => item[start_date])));
    setEndTime(Math.max(...value.map((item) => item[end_date])));
    setMeetingRoom(value);
    setPlaceChoose(sign ?? 'meetingList');
  };
  const chooseTimeQuantumVideo = (value: any[]) => {
    setVideoBackfillMetting(value);
    setVideoRoom(value);    
  };
  
  
  // 跳转页面-新建会议
  const finalJumpHandle = (data: Record<string, any>) => {
    console.log(data,"---data--");
  };
  // 跳转事件_申请会议室
  const finalJumpHandle_apply = (data: Record<string, any>) => {
    console.log(data);
  };

  // 解析会议地点&发送会议
  const resolutionMeetingVenue = async (params: any) => {
     //如果是从M5点击过来的新建，则从发送消息卡片
     if (isFromM5) {
      params.m5SendMsgCardInfoDto = {
        targetId:targetId,
        targetType:targetType === 'group' ? 3 : 1
      }
    }
    // 解析会议地点
    const result = await resolutionMeetingVenueAsync(params);
    if (result.content) {
      Toast.show({
        icon: 'success',
        content: i18nSelf('SuccessfullySent', '发送成功'),
        duration: 400
      });
      setTimeout(() => {
        (window as any).jsSdk?.router?.back({ success: () => {} });
      }, 300);
    } else {
      Toast.show({
        icon: 'fail',
        content: i18nSelf('LongText1', '会议室占用有冲突，创建会议失败'),
      });
    }
  };

  /**
   * 判断会议事件是否一致
   * @param params 入参
   * @param isParsing 区分 直接解析或者正常流程逻辑
   */
  const checkConsistentTime = async (params: any) => {
    // 判断会议时间与会议室时间是否一致
    const result = await checkConsistentTimeAsync(params);
    const newParams = JSON.parse(JSON.stringify(params));
    if (result.content) {
      // 一致
      newParams.isConsistent = true;
      // 解析&发送会议
      resolutionMeetingVenue(newParams);
    } else {
      // 不一致
      newParams.isConsistent = false;
      Dialog.confirm({
        content: `${i18nSelf('LongText2', '会议时间与会议室时间不一致')}${i18nSelf(
          'WhetherToSend',
          '是否发送',
        )}`,
        onConfirm: () => {
          // 解析&发送会议
          resolutionMeetingVenue(newParams);
        },
        onCancel: () => {
          return;
        },
      });
    }
  };

  /**
   * 判断会议室是否会被占用
   * @param params 入参
   * @param isParsing 区分 直接解析或者正常流程逻辑
   */
  const checkWhetherOccupied = async (params: any) => {
    if (params.roomID && params.placeChoose) {
      // 判断会议室是否会被占用
      const result = await checkWhetherOccupiedAsync(params);
      if (result.content === '') {
        // 未被占用
        checkConsistentTime(params);
      } else {
        // 被占用
        // confirm({
        //   title: '会议室占用冲突错误',
        //   content: result.content + ' 所选会议室已被占用，请重新选择会议室！',
        // });
        Dialog.alert({
          content:
            result.content + ` ${i18nSelf('LongText4', '所选会议室已被占用，请重新选择会议室')}！`,
          onConfirm: () => {
            return;
          },
        });
      }
    } else {
      resolutionMeetingVenue(params);
    }
  };

  //发送会议聚合接口
  const meetingIsSuccessSend = async (params:any, val:number) => {
    params.createMeetingStep = val
    try {
    if (isFromM5) {
        params.m5SendMsgCardInfoDto = {
          targetId:targetId,
          targetType:targetType === 'group' ? 3 : 1
        }
      }
    const res =  await  MeetingTimePeopleAsync(params)
      Toast.show({
        icon: 'success',
        content: i18nSelf('SuccessfullySent', '发送成功'),
        duration: 400
      });
      if (params?.meetingStatus === 'DAIFASONG') {
        Toast.show({
          icon: 'success',
          content: i18nSelf('SuccessfullySaved', '保存成功'),
          duration: 400
        });
         //如果是从M5点击过来的新建，则从发送消息卡片
        if (isFromM5) {
          sendMessageCard(res.content);
        }
        setTimeout(() => {
          (window as any).jsSdk?.router?.back({ success: () => {} });
        }, 300)
      }
      (window as any).jsSdk?.router?.back({ success: () => {} });
    } catch (error:any) {
      let res = error.message
          if(res.includes("时间冲突人员")) {
            Dialog.confirm({
              content: res,
              onConfirm: async () => {
                // 解析&发送会议
                await meetingIsSuccessSend(params,1);
              },
              onCancel: () => {},
            });
          
          }else if(res.includes('所选会议室已被占用')){
            Dialog.alert({
              content:res,
              onConfirm: () => {
                return;
              },
            });
          }else if(res.includes('会议时间不一致')) {
            params.isConsistent = false;
            Dialog.confirm({
              content: `${i18nSelf('LongText2', '会议时间与会议室时间不一致')}${i18nSelf(
                'WhetherToSend',
                '是否发送',
              )}`,
              onConfirm: () => {
                // 解析&发送会议
                meetingIsSuccessSend(params,3);
              },
              onCancel: () => {},
            });
        }else{
          params.isConsistent = true;
          Toast.show({
            icon: 'fail',
            content: res,
          });
          Toast.show(res)
        }
    }
    
  }

  // 提取发送请求主体
  const submitComponent = async (status: string, params: any) => {
    if (status === 'send') {
      meetingIsSuccessSend(params,0)
      // const result1 = await checkConflictsAsync(params);
      // if (result1.content === '时间冲突人员：') {
      //   // 无冲突
      //   await checkWhetherOccupied(params);
      // } else {
      //   Dialog.confirm({
      //     content: result1.content,
      //     onConfirm: async () => {
      //       // 解析&发送会议
      //       await checkWhetherOccupied(params);
      //     },
      //     onCancel: () => {
      //       return;
      //     },
      //   });
      // }
    } else {
      params = { ...params, meetingStatus: 'DAIFASONG' };
      //const result = await saveReadyMeetingAsync(params);
      const result = await resolutionMeetingVenueAsync(params);
      if (result.content) {
        Toast.show({
          icon: 'success',
          content: i18nSelf('SuccessfullySaved', '保存成功'),
          duration: 400
        });
        //如果是从M5点击过来的新建，则从发送消息卡片
        if (isFromM5) {
          sendMessageCard(result.content);
        }
        setTimeout(() => {
          (window as any).jsSdk?.router?.back({ success: () => {} });
        }, 300);
      } else {
        Toast.show({
          icon: 'fail',
          content: res,
        });
      }
      
    }
  };


  useEffect(() => {
    if(videoRoom?.length > 0) {
      let strStart =  moment(videoRoom[0]?.startTime).format('YYYY-MM-DD HH:mm')
      let strEnd =  moment(videoRoom[0]?.endTime).format('YYYY-MM-DD HH:mm')
      let names =  videoRoom[0]?.roomName
      let str = `${names}(${strStart}-${strEnd})`
      setRoomStr(str)
    }
  },[videoRoom])
 console.log(videoRoom,"videoRoom-*-------");

 
 
  // 发送事件
  const submitHandle = async (status: string) => {
    if (title.length === 0) {
      SetTipVisible((tipVisible) => [...tipVisible, '4']);
      return;
    }
    if (emceeId.length === 0) {
      SetTipVisible((tipVisible) => [...tipVisible, '1']);
      return;
    }
    if (selectPeople.length === 0) {
      SetTipVisible((tipVisible) => [...tipVisible, '2']);
      return;
    }
    if (recorderId.length === 0) {
      SetTipVisible((tipVisible) => [...tipVisible, '3']);
      return;
    }
    const _d = testRepeatPeople(
      'impart',
      { emceeId, recorderId, selectPeople, impart },
      i18nSelf('InformPeople', '告知人'),
    );
    if (_d) return;
    const _c = testRepeatPeople(
      'selectPeople',
      { emceeId, recorderId, selectPeople, impart },
      i18nSelf('Participants', '参会人'),
    );
    if (_c) return;
    const _b = testRepeatPeople(
      'recorderId',
      { emceeId, recorderId, selectPeople, impart },
      i18nSelf('Recorder', '记录人'),
    );
    if (_b) return;
    const _a = testRepeatPeople(
      'emceeId',
      { emceeId, recorderId, selectPeople, impart },
      i18nSelf('Host', '主持人'),
    );
    if (_a) return;
    let params: Record<string, any>;
    const content = await (handleRef.current as any).save();
    if (parseUrl().id && parseUrl().pageOpenMode === 'edit') {
      params = {
        id: parseUrl().id,
        title,
        startTime,
        endTime,
        placeChoose: meetingMap[placeChoose],
        emceeId: emceeId.map((item) => item?.id).join(','),
        selectpeople: JSON.stringify(selectPeople),
        recorderId: recorderId.map((item) => item?.id).join(','),
        impart: impart.map((item) => item?.id).join(',') || '',
        remindTime: remindTime[0],
        article: article.map((item) => item?.id).join(',') || '',
        meetingCategory: meetingCategory.map((item) => item?.id).join(',') || '0',
        attachment: fileList.map((item) => item?.storageKey).join(','),
        content: JSON.stringify(content),
        emceeName: emceeId ? JSON.stringify(emceeId) : '[]',
        recorderName: recorderId ? JSON.stringify(recorderId) : '[]',
        articleName: article ? JSON.stringify(article) : '[]',
        meetingCategoryName: meetingCategory ? JSON.stringify(meetingCategory) : '[]',
        meetingFileName: fileList ? JSON.stringify(fileList) : '[]',
        ...hiddenData,
        ...seasonal,
        zqxbyzd,
        periodicityId: editData?.periodicityId,
        videoRoom:roomStr,
      };
    } else {
      params = {
        title,
        startTime,
        endTime,
        placeChoose: meetingMap[placeChoose],
        emceeId: emceeId.map((item) => item?.id).join(','),
        selectpeople: JSON.stringify(selectPeople),
        recorderId: recorderId.map((item) => item?.id).join(','),
        impart: impart.map((item) => item?.id).join(',') || '',
        remindTime: remindTime[0],
        article: article.map((item) => item?.id).join(',') || '',
        meetingCategory: meetingCategory.map((item) => item?.id).join(',') || '0',
        attachment: fileList.map((item) => item?.storageKey).join(','),
        emceeName: emceeId ? JSON.stringify(emceeId) : '[]',
        recorderName: recorderId ? JSON.stringify(recorderId) : '[]',
        articleName: article ? JSON.stringify(article) : '[]',
        meetingCategoryName: meetingCategory ? JSON.stringify(meetingCategory) : '[]',
        meetingFileName: fileList ? JSON.stringify(fileList) : '[]',
        content: JSON.stringify(content),
        ...hiddenData,
        ...seasonal,
        periodicityId: null,
        videoRoom:roomStr
        
      };
    }
    //周期性会议时候传参
    zqxbyzd === '1' && (params.isApplyAllMeetings = isApplyAllMeetings);
    // 查询会议是否有冲突
    if (!params.meetingStatus) delete params.meetingStatus;
    if (params?.startTime < moment().valueOf()) {
      Dialog.confirm({
        content: `${i18nSelf(
          'LongText6',
          '会议开始时间小于当前时间，此会议发生在过去，确认提交吗',
        )}？`,
        onConfirm: async () => submitComponent(status, params),
        onCancel: () => {
          return;
        },
      });
    } else {
      submitComponent(status, params);
    }
  };

  // 编辑初始化获取数据
  const getMeetingDetail = async (editId: string) => {
    const result = await getMeetingDetailAsync({ id: editId });
    if (result.content) {
      const {
        emceeId,
        emceeName = '[]',
        impart,
        impart___displayname,
        recorderId,
        recorderName = '[]',
        remindTime,
        selectpeople,
        title,
        startTime,
        endTime,
        intervalDays,
        repeatEndTime,
        repeatMode,
        repeatStrategy,
        repeatability,
        placeChoose,
        huiyixiangqing = '',
        meetingStatus,
        shipinhuiyixiangqing,
        content,
        articleName = '[]',
        meetingCategoryName = '[]',
        meetingFileName = '[]',
        isApplyAllMeetings,
        zqxbyzd,
        id,
      } = result.content;

      setEditData(result.content);
      let meetingPlaceValue: any = {};
      if (huiyixiangqing) {
        // 线下会议数据
        const meeting = JSON.parse(huiyixiangqing).map((item: any) => ({
          startTime: item.startDate,
          endTime: item.endDate,
          roomID: item.roomId,
          roomName: item.roomPlace,
        }));
        setMeetingRoom(meeting);
        setBackfillMetting(meeting);
      }
      // 视频会议数据
      if (shipinhuiyixiangqing) {
        const meeting = JSON.parse(shipinhuiyixiangqing).map((item: any) => ({
          startTime: item.startDate,
          endTime: item.endDate,
          roomID: item.roomId,
          roomName: item.roomPlace,
        }));
        setVideoRoom(meeting);
        setVideoBackfillMetting(meeting);
      }
      if (content) {
        let key;
        if (content.indexOf('initial') > -1) {
          key = JSON.parse(content)?.initial?.content;
        } else {
          key = JSON.parse(content)?.content;
        }
        setContentKey(key);
        setContentCont(content);
      }
      hiddenData.meetingStatus = meetingStatus;
      hiddenData.zqxbyzd = zqxbyzd;

      setTitle(title);
      setEmceeId(JSON.parse(emceeName));
      setImpart(impart___displayname);
      setSelectPeople(JSON.parse(selectpeople));
      setRecorderId(JSON.parse(recorderName));
      setSeasonal({ intervalDays, repeatEndTime, repeatMode, repeatStrategy,repeatability });
      setRemindTime([remindTime]);
      setArticle(isJSONStr(articleName) ? JSON.parse(articleName) : []);
      setMeetingCategory(isJSONStr(meetingCategoryName) ? JSON.parse(meetingCategoryName) : []);
      setFileList(isJSONStr(meetingFileName) ? JSON.parse(meetingFileName) : []);
      setStartTime(Number(startTime));
      setEndTime(Number(endTime));
      setIsApplyAllMeetings(isApplyAllMeetings);
      setZqxbyzd(zqxbyzd);
      setId(id);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setEmceeId([{ id: currentUser?.userId, name: currentUser?.userName }]); // 主持人
      setRecorderId([{ id: currentUser?.userId, name: currentUser?.userName }]); // 记录人
    }
  }, [currentUser?.userId]);

  useEffect(() => {
    if (parseUrl()?.huiyixiangqing) {
      setPlaceChoose('meetingList');
    }
  }, []);

  useEffect(() => {
    if (parseUrl().id && parseUrl().pageOpenMode === 'edit') {
      getMeetingDetail(parseUrl().id);
    }
    const _isFromM5 = parseUrl()?.from === 'M5' ? true : false;
    setIsFromM5(_isFromM5);
    if (_isFromM5) {
      getTeamMember().then((info) => {
        console.log(info, 'infoinfoinfoinfo');
        const { people, targetType } = info;
        targetType === 'single' && setSelectPeople(people);
      });
    }
  }, []);

  // 除了记录人和主持人可以重复， 其他均不能重复
  const testRepeatPeople = (type: string, data: any, sign?: string) => {
    const returnText = judgeRepeatPeople(type, data, sign);
    returnText &&
      Dialog.alert({
        content: returnText,
      });
    return returnText;
  };

    //控制视频会议室
    useEffect(() => {
      (
        async () => {
        let { content } =  await  getVideoMeetingRoomPlugin()
        setHasVideoRoom(content[0])
        }
      )()
    },[])
    //底部安全距离
    useEffect(() => {
      if ((window as any).jsSdk) {
        const sInfo = (window as any).jsSdk?.device?.getSystemInfoSync();
        sInfo && setSystemInfo(JSON.parse(sInfo));
        console.log(sInfo, "sInfo");
      }
    }, []);

  return (
    <div className={styles.container}>
      <div className={styles.domWrap}>
        <div className={styles.inputWrap}>
          <Input
            onChange={(e) => {
              setTitle(e);
              if (e.length > 0) {
                SetTipVisible((tipVisible) => tipVisible.filter((item) => item !== '4'));
              }
            }}
            placeholder={i18nSelf('LongText8', '请填写会议主题')}
            style={{ '--placeholder-color': '#B1B8C4', fontSize: 14, fontWeight: 500 }}
            value={title}
          />
          <div
            style={{
              color: 'red',
              marginLeft: 4,
              padding: '4px 0',
              display: tipVisible.includes('4') ? 'block' : 'none',
            }}>
            {i18nSelf('LongText8', '请填写会议主题')}
          </div>
        </div>
        {/* 时间选择 */}

        <div className={styles.timePicker_container}>
          <div className={styles.timePicker}>
            <DateTimePicker
              precision="minute"
              value={startTime}
              onConfirm={(val) => {              
                if (compareTime(Number(val), Number(endTime))) {
                  setStartTime(val);
                  setEndTime(moment(val).add(1, 'hour').valueOf());
                  return;
                }
                setStartTime(val);
              }}>
              {(value: any) => (
                <div className={styles.timeSelect}>
                  <div >
                    {i18nSelf('StartTime', '开始时间')} <span>*</span>
                  </div>
                  <div>{`${moment(startTime).format('YYYY-MM-DD')} ${
                    weekMap[moment(startTime).day()]
                  }`}</div>
                  <div>{moment(startTime).format('HH:mm')}</div>
                </div>
              )}
            </DateTimePicker>
            <div style={{marginRight:"5px"}}> <SyIcon
              name="LinedRightSmallM"
              color="#9DA6B2"
              fontSize={20}
              style={{ fontSize: 20, color: '#9da6b2' }}
            /></div>
            <DateTimePicker
              precision="minute"
              value={endTime}
              onConfirm={(val) => {
                if (compareTime(Number(startTime), Number(val))) {
                  Toast.show({
                    icon: 'fail',
                    content: i18nSelf('LongText10', '会议结束时间需要大于开始时间'),
                  });
                  return;
                }

                setEndTime(val);
              }}>
              {(value: any) => (
                <div className={styles.timeSelect}>
                  <div >
                    {i18nSelf('EndTime', '结束时间')} <span>*</span>
                  </div>
                  <div>{`${moment(endTime).format('YYYY-MM-DD')} ${
                    weekMap[moment(endTime).day()]
                  }`}</div>
                  <div>{moment(endTime).format('HH:mm')}</div>
                </div>
              )}
            </DateTimePicker>
          </div>
        </div>
      {
        zqxbyzd === '1' && (
          <div className={styles.zhouqiwrap}>
            <>是否对所有周期性会议生效 <Switch
              checked={isApplyAllMeetings}
              onChange={(checked: any) => {
              setIsApplyAllMeetings(!isApplyAllMeetings)
              }}
            /></>
        </div>
        )
      }  
       
        {/* 表单设置 */}
        <div className={styles.form}>
          <div className={styles.formItem}>
            <div className={styles.formItemLabel}>{i18nSelf('MeetingPlace', '会议地点')}</div>
            <Input
              readOnly
              onClick={() => setVisible(2)}
              value={meetingRoom.map((item) => item[contentName]).join(',')}
            />
            <SyIcon
              name="LinedRightSmallM"
              color="#9DA6B2"
              fontSize={20}
              style={{ fontSize: 20, color: '#9da6b2' }}
              onClick={() => setVisible(2)}
            />
          </div>
          {
            hasVideoRoom?.hasPlugin && (<div className={styles.formItem}>
              <div className={styles.formItemLabel}>{i18nSelf('VideoRoom', '视频会议室')}</div>
              <Input
                readOnly
                onClick={() => setVisible(3)}
                value={videoRoom.map((item) => item[contentName]).join(',')}
              />
              <SyIcon
                name="LinedRightSmallM"
                color="#9DA6B2"
                fontSize={20}
                style={{ fontSize: 20, color: '#9da6b2' }}
                onClick={() => setVisible(3)}
              />
            </div>

            )
          }
          
          <div className={styles.formItem}>
            <div className={styles.formItemLabel}>
              {i18nSelf('Host', '主持人')} <span>*</span>
            </div>
            <Reference
              applicationName="billarchive1957033645480561621"
              appName="organization"
              entityName="orgMember"
              fullName="com.seeyon.organization.domain.core.entity.OrgMember"
              onChange={(list: any[]) => {
                setEmceeId(list);
                if (list.length > 0) {
                  SetTipVisible((tipVisible) => tipVisible.filter((item) => item !== '1'));
                }
                testRepeatPeople('emceeId', { emceeId: list, recorderId, selectPeople, impart });
              }}
              value={emceeId}
              remoteComponent={RemoteComponent}
            />
          </div>
          <div
            style={{
              color: 'red',
              marginLeft: 80,
              padding: '4px 0',
              display: tipVisible.includes('1') ? 'block' : 'none',
            }}>
            {`${i18nSelf('PleaseSelect', '请选择')}${i18nSelf('Host', '主持人')}`}
          </div>
          <div className={styles.formItem}>
            <div className={styles.formItemLabel}>
              {i18nSelf('Participants', '参会人')} <span>*</span>
            </div>
            <Input
              readOnly
              placeholder={i18nSelf('PleaseSelect', '请选择')}
              onClick={() => setVisible(1)}
              value={selectPeople.map((item) => item?.n).join('、')}
            />
            <SyIcon
              name="LinedRightSmallM"
              color="#9DA6B2"
              fontSize={20}
              style={{ fontSize: 20, color: '#9da6b2' }}
              onClick={() => setVisible(1)}
            />
          </div>
          <div
            style={{
              color: 'red',
              marginLeft: 80,
              padding: '4px 0',
              display: tipVisible.includes('2') ? 'block' : 'none',
            }}>
            {`${i18nSelf('PleaseSelect', '请选择')}${i18nSelf('Participants', '参会人')}`}
          </div>
        </div>
        {/* 分组 */}
        <Collapse defaultActiveKey={[]}>
          <Collapse.Panel
            key="1"
            className={styles.collapsePanel}
            title={
              <div>
                {i18nSelf('More', '更多设置')}
                <span>{`(${i18nSelf('InformPeople', '告知人')}${i18nSelf(
                  'LongText21',
                  '、周期重复等',
                )})`}</span>
              </div>
            }>
            <div className={styles.form}>
              <div className={styles.formItem}>
                <div className={styles.formItemLabel}>
                  {i18nSelf('Recorder', '记录人')}
                  <span>*</span>
                </div>
                <Reference
                  applicationName="billarchive1957033645480561621"
                  appName="organization"
                  entityName="orgMember"
                  fullName="com.seeyon.organization.domain.core.entity.OrgMember"
                  onChange={(list: any[]) => {
                    setRecorderId(list);
                    if (list.length > 0) {
                      SetTipVisible((tipVisible) => tipVisible.filter((item) => item !== '3'));
                    }
                    testRepeatPeople('recorderId', {
                      emceeId,
                      recorderId: list,
                      selectPeople,
                      impart,
                    });
                  }}
                  value={recorderId}
                  remoteComponent={RemoteComponent}
                />
              </div>
              <div
                style={{
                  color: 'red',
                  marginLeft: 80,
                  padding: '4px 0',
                  display: tipVisible.includes('3') ? 'block' : 'none',
                }}>
                {`${i18nSelf('PleaseSelect', '请选择')}${i18nSelf('Recorder', '记录人')}`}
              </div>
              <div className={styles.formItem}>
                <div className={styles.formItemLabel}>{i18nSelf('InformPeople', '告知人')}</div>
                <Reference
                  applicationName="billarchive1957033645480561621"
                  appName="organization"
                  entityName="orgMember"
                  fullName="com.seeyon.organization.domain.core.entity.OrgMember"
                  multiSelect={true}
                  onChange={(list: any[]) => {
                    setImpart(list);
                    testRepeatPeople('impart', {
                      emceeId,
                      recorderId,
                      selectPeople,
                      impart: list,
                    });
                  }}
                  value={impart}
                  remoteComponent={RemoteComponent}
                />
              </div>
              <div className={styles.formItem}>
                <div className={styles.formItemLabel}>
                  {i18nSelf('SettingPeriodicity', '周期性设置')}
                </div>
                <SeasonalSet onChange={(value: any) => setSeasonal(value)} seasonal={seasonal} />
              </div>
              <div className={styles.formItem}>
                <div className={styles.formItemLabel}>{i18nSelf('RemindTime', '提醒时间')}</div>
                <ActionSheet
                    visible={Reminder}
                    actions={(useMetadata('enum', '636664957775660162') as any)?.items.map(
                      (item: any) => {
                        item.text = i18n.t({ k:item.fullName, d:item.caption });
                        item.key = item.name;
                        return item;
                      },
                    )}      
                    onAction={(val:any) => {setReminder(false); setRemindTime(val.key) ; setRemindTime1(val.text); console.log(val,"val996---");
                    }} 
                    cancelText={'取消'}         
                    onClose={() => {setReminder(false)}}
                  />
                <Input readOnly value={remindTime1}  placeholder={i18nSelf('PleaseSelect', '请选择')}  onClick={() => setReminder(true)} />
              <SyIcon name="LinedRightSmallM"  />
              {/* <Select
                  placeholder={i18nSelf('PleaseSelect', '请选择')}
                  options={(useMetadata('enum', '636664957775660162') as any)?.items.map(
                    (item: any) => {
                      item.label = item.caption;
                      item.value = item.name;
                      return item;
                    },
                  )}
                  onChange={(value) => setRemindTime(value)}
                  value={remindTime}
                /> */}
              </div>
              <div className={styles.formItem}>
                <div className={styles.formItemLabel}>
                  {i18nSelf('SuppliesForConference', '会议用品')}
                </div>
                <Reference
                  applicationName="billarchive1957033645480561621"
                  appName="billarchive1957033645480561621"
                  entityName="article"
                  fullName="com.seeyon.billarchive1957033645480561621.domain.entity.Article"
                  multiSelect={true}
                  onChange={(list: any[]) => {
                    setArticle(list);
                  }}
                  value={article}
                  remoteComponent={RemoteComponent}
                />
              </div>
              <div className={styles.formItem1}>
                <div className={styles.formItemLabel1}>
                  {i18nSelf('ClassificationOfMeetings', '会议类别')}
                </div>
                <Reference
                  applicationName="billarchive1957033645480561621"
                  appName="billarchive1957033645480561621"
                  entityName="meetingCategory"
                  fullName="com.seeyon.billarchive1957033645480561621.domain.entity.MeetingCategory"
                  onChange={(list: any[]) => {
                    setMeetingCategory(list);
                  }}
                  value={meetingCategory}
                  remoteComponent={RemoteComponent}
                />
              </div>
              {/* <div className={styles.formItem1}>
                <div className={styles.formItemLabel1}>{i18nSelf('AnnotationType', '正文类型')}</div>
              </div> */}
            </div>
          </Collapse.Panel>
        </Collapse>
        <div className={styles.form} style={{ paddingTop: 0, paddingBottom: 15 }}>
          <RuntimeCmp
            storageKey={contentKey}
            content={JSON.parse(contentCont ?? '{}')}
            ref={handleRef}
          />
        </div>
        <div
          className={styles.form}
          style={{ marginTop: 12,  paddingBottom: fileList.length > 0 ? 16 : 0 }}>
          <div className={styles.formItem}>
            <div style={{}} className={styles.formItemLabel}>{i18nSelf('Attachment', '附件')}</div>
            <FileUpload
              appName="billarchive1957033645480561621"
              onChange={handleUploadChange}
              multiple={true}
              fileList={fileList}
              showUploadList={false}>
              <div className={styles.fileWrap} >
                <Input  readOnly placeholder={i18nSelf('PleaseSelect', '请选择')} />
                <SyIcon
                  name="LinedRightSmallM"
                  color="#9DA6B2"
                  fontSize={20}
                  style={{ fontSize: 20, color: '#9da6b2' }}
                />
              </div>
            </FileUpload>
          </div>
          <div>
            {fileList.length > 0 && (
              <Download
                appName="billarchive1957033645480561621"
                showRemove={true}
                storageKeys={fileList}
                onRemove={handleRemove}
              />
            )}
          </div>
        </div>
      </div>
      <div className={styles.btnSafeWrap} style={{paddingBottom: systemInfo?.safeAreaBottomHeight || "30px"}}>
      <div className={styles.editorGroup} >
        <div className={styles.but_1}>
        <Button onClick={() => submitHandle('ready')} size='large' style={{ width: '40vw', backgroundColor: 'var(--fill-weak, #F5F5F5)' }} color="default" fill="none">
        {i18nSelf('SaveAndWaitToSend', '保存待发')}
        </Button>
        <Button  onClick={() => submitHandle('send')} size='large'  color="primary" style={{ width: '40vw' }}>
        {i18nSelf('Submit', '发送')}
        </Button>
        </div>
      </div>
      </div>
      
      {visible === 1 && (
        <OrgSelector
          visible={true}
          onOk={(e: any) => {
            setSelectPeople(e);
            setVisible(0);
            if (e.length > 0) {
              SetTipVisible((tipVisible) => tipVisible.filter((item) => item !== '2'));
            }
            testRepeatPeople('selectPeople', {
              emceeId,
              recorderId,
              selectPeople: e,
              impart,
            });
          }}
          value={selectPeople}
          onCancel={() => {
            setVisible(0);
          }}
          options={{
            mode:'member',
            valueType: 'full',
            // tabs: ['department', 'institution'],
            selectType: ['DEPARTMENT', 'INSTITUTION', 'MEMBER','OUTSIDE_MEMBER','DEPARTMENT','PROJECT_DEPARTMENT','EXTERNAL_MEMBER'],
          }}
        />
      )}
      <Popup
        visible={visible === 2}
        position="right"
        bodyStyle={{ minWidth: '100vw' }}
        style={{ '--z-index': '1000' }}
        onMaskClick={() => setVisible(0)}>
        <SchedulerMobileSelf
          appName="billarchive1957033645480561621"
          meetingEntity={meetingEntity}
          meetingDetails={meetingDetails}
          videoMeetingDetails={videoMeetingDetails}
          roomType="1"
          backfillMetting={backfillMetting}
          filterCondition={filterCondition}
          chooseTimeQuantum={chooseTimeQuantum}
          formulaDisplay="apply"
          showHandle={() => setVisible(0)}
          finalJumpHandle={finalJumpHandle}
          finalJumpHandle_apply={finalJumpHandle_apply}
          startFromInput={startTime}
          endFromInput={endTime}
          popVisible={visible === 2}
        />
      </Popup>
      <Popup
        visible={visible === 3}
        position="right"
        style={{ '--z-index': '1000' }}
        bodyStyle={{ minWidth: '100vw' }}
        onMaskClick={() => setVisible(0)}>
        <SchedulerMobileSelf
          appName="billarchive1957033645480561621"
          meetingEntity={meetingEntity}
          meetingDetails={meetingDetails}
          videoMeetingDetails={videoMeetingDetails}
          roomType="2"
          backfillMetting={videoBackfillMetting}
          filterCondition={filterCondition}
          chooseTimeQuantum={chooseTimeQuantumVideo}
          formulaDisplay="apply"
          showHandle={() => setVisible(0)}
          finalJumpHandle={finalJumpHandle}
          finalJumpHandle_apply={finalJumpHandle_apply}
          startFromInput={startTime}
          endFromInput={endTime}
          popVisible={visible === 3}
        />
      </Popup>
    </div>
  );
};

export default Index;
