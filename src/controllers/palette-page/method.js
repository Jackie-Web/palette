/**
 * Created by Jackie.Wu on 2017/4/16.
 */

import React from 'react';
import initState from './init-state';
import axios from '../../libs/axios';
import axiosAll from 'axios';
import pageAjax from '../../libs/pageAjax';
import { Toast, Modal } from 'antd-mobile';
import copy from 'clone';

const alert = Modal.alert;

export default class method extends React.Component {
    constructor(props) {
        super(props);
        this.state = initState;
        this.isInitCanvas = true;
        this.canvasNextArr = [];
    }

    async componentDidMount() {
        // 进入页面 set 默认值
        await axios({ url: pageAjax.LoginPower });
        const wxConfig = await axios({ url: pageAjax.ShareGetParm });
        wx.config({
            debug: true,
            appId: wxConfig.data.appId,
            timestamp: wxConfig.data.timestamp,
            nonceStr: wxConfig.data.nonceStr,
            signature: wxConfig.data.signature,
            jsApiList: [
                'onMenuShareTimeline',
                'onMenuShareAppMessage',
                'onMenuShareQQ',
                'onMenuShareWeibo',
                'onMenuShareQZone',
                'startRecord',
                'stopRecord',
                'onVoiceRecordEnd',
                'chooseImage',
                'previewImage',
                'uploadImage',
                'downloadImage',
                'openLocation',
                'getLocation',
                'hideOptionMenu',
                'showOptionMenu',
                'hideMenuItems',
                'showMenuItems',
                'closeWindow',
                'scanQRCode',
            ],
        });

        wx.ready(()=>{
            this.initCanvas();
        });
    }

    async saveUpdate(type, options = {}, state) {
        if (type === 'saveWork') {
            // 保存作品用到的接口
            const save = await axios({
                url: pageAjax.UserLectionAddWorks,
                method: 'post',
                params: options
            });
            if (save.code === 0) {
                Toast.success(save.msg, 1);
                this.setState(state);
            }
        } else {
            const save = await axios({
                url: pageAjax.UserUpdateState,
                method: 'post',
                params: options
            });
            if (save.code === 0) {
                Toast.success(save.msg, 1);
                for (let i in options) {
                    state.defaultPage[i] = options[i]
                }
                this.setState(state);
            }
        }
    }


    async pageLeftSwitch(item, options = {}, e) {
        e.stopPropagation();
        e.preventDefault();
        const self = this;
        const state = copy(self.state);
        this.isInitCanvas = false;

        if (item.link === 'rubber') {
            if (state.pageSwitch['index']) {
                self.clearCanvas();
            }
        } else {
            if (!state.pageSwitch[item.link]) {
                document.title = item.title;
                for (let i in state.pageSwitch) {
                    state.pageSwitch[i] = item.link === i;
                }
                // 如果是从各个页面点回到首页的那么做页面处理
                if (options.tie) {
                    // 先查看用户是否可以保存作品
                    const isSave = await axiosAll.get(pageAjax.UserLectionWorksIsOver);
                    if (isSave.data.code !== 0) {
                        alert('提示', isSave.data.msg, [
                            {
                                text: '取消', onPress: () => {
                                this.setState(state);
                            }
                            },
                            {
                                text: '确定', onPress: () => {
                                self.saveUpdate('saveWork', {
                                    bh_id: options.tie.b_id,
                                }, state);
                            }
                            },
                        ]);
                    } else {
                        self.saveUpdate('saveWork', {
                            bh_id: options.tie.b_id,
                        }, state);
                    }
                } else if (options.music) {
                    self.saveUpdate('update', {
                        m_id: options.music.m_id,
                    }, state);
                } else if (options.pen) {
                    self.saveUpdate('update', {
                        fontsize: state.defaultPage.fontsize,
                        color: state.defaultPage.color,
                    }, state);
                } else if (options.person) {

                } else if (options.offline) {
                    state.offlineMakeState.param.bs_id = options.offline.bs_id;
                    state.offlineMakeState.title = options.offline.bs_name;
                    self.setState(state);
                } else {
                    self.setState(state)
                }
            }
        }
    }

    onAnimateEnd({ key, type }) {
        if (key === 'index' && type === 'enter') {
            if (this.isInitCanvas) {
                this.canvasMethod.initCanvas();
            } else {
                this.initCanvas();
            }
        }
    }

    subCanvas(self) {
        this.canvasMethod = self;
    }

    async initCanvas() {
        const self = this;
        const state = copy(this.state);
        const data = await axiosAll.all([
            axios({ url: pageAjax.userLectionMyDetail }),
            axios({ url: pageAjax.LectionGetWordList })
        ]);
        //setTimeout(()=>{
        //    this.isInitCanvas = true;
        //},500);

        state.defaultPage = data[0].data;

        state.indexState.currentNumber = data[0].data.position - 1;
        state.indexState.allNumber = data[1].data.length - 1;
        state.indexState.indexData = data[1].data;
        self.setState(state);
        this.canvasMethod.initCanvas();
    }

    clearCanvas() {
        this.canvasMethod.clearCanvas();
    }

    prevFont() {
        const self = this;
        const state = copy(this.state);
        if (state.indexState.currentNumber > 0) {
            state.indexState.currentNumber -= 1;
            this.clearCanvas();
            self.setState(state);
        } else {
            Toast.info(state.indexState.prevToast, 2)
        }
    }

    nextFont() {
        const self = this;
        const state = copy(this.state);
        //console.log(this.canvasMethod.canvasToBase());
        if (this.canvasMethod.beginWrite) {
            if (state.indexState.currentNumber < state.indexState.allNumber) {
                setTimeout(() => {
                    state.indexState.currentNumber += 1;
                    //console.log(state.indexState.indexData[state.indexState.currentNumber - 1]);
                    self.clearCanvas();
                    if (self.canvasNextArr.length < state.nextNumberAjax) {
                        self.canvasNextArr.push({
                            w_id: state.indexState.indexData[state.indexState.currentNumber - 1].w_id,
                            baseImg: this.canvasMethod.canvasToBase()
                        })
                    }
                    if (self.canvasNextArr.length >= state.nextNumberAjax) {
                        axios({
                            url: pageAjax.UserLectionUploadImg,
                            method: 'post',
                            params: {
                                bh_id: state.defaultPage.bh_id,
                                imgdata: self.canvasNextArr
                            },

                        });
                        self.canvasNextArr = [];
                    }
                    self.setState(state);
                }, 200);
            } else {
                Toast.info(state.indexState.nextToast, 2);
            }
        } else {
            Toast.info('请把字写好', 2);
        }

    }

    changePenColor(index, type) {
        const state = copy(this.state);
        if (type === 'pen') {
            state.penColorState.penSize.map((item, i) => {
                item.active = index === i;
                if (item.active) (state.defaultPage.fontsize = item.size)
            });

        } else {
            state.penColorState.color.map((item, i) => {
                item.active = index === i;
                if (item.active) (state.defaultPage.color = item.value)
            });
        }
        this.setState(state);
    }
};
