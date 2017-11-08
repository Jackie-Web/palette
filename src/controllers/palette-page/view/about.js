/**
 * Created by Jackie.Wu on 2017/10/25.
 */
import React, { Component } from 'react'
import { ListView } from 'antd-mobile';


const MyBody = (props) => <div className="about__box__body">
    {props.children}
</div>;

export default class extends Component {

    constructor(props) {
        super(props);
        const getSectionData = (dataBlob, sectionID) => dataBlob[sectionID];
        const getRowData = (dataBlob, sectionID, rowID) => dataBlob[rowID];

        const dataSource = new ListView.DataSource({
            getRowData,
            getSectionHeaderData: getSectionData,
            rowHasChanged: (row1, row2) => row1 !== row2,
            sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
        });

        this.dataBlob = {};
        this.sectionIDs = [];
        this.rowIDs = [];
        this.genData = (length = 1) => {
            this.rowIDs['0'] = [];
            for (let jj = 0; jj < length; jj++) {
                const rowName = `S${jj}, R${jj}`;
                this.rowIDs['0'].push(rowName);
                this.dataBlob[rowName] = rowName;
            }
            // new object ref
            this.sectionIDs = ['Section 0'];
            this.rowIDs = [].concat(this.rowIDs);
        };

        this.state = {
            dataSource: dataSource.cloneWithRowsAndSections(this.dataBlob, this.sectionIDs, this.rowIDs),
            isLoading: true,
        };
    }

    componentDidMount() {
        // simulate initial Ajax
        this.genData();
        this.setState({
            dataSource: this.state.dataSource.cloneWithRowsAndSections(this.dataBlob, this.sectionIDs, this.rowIDs),
            isLoading: false,
        });
    }


    render() {
        const state = this.props.self.state;
        const row = (rowData, sectionID, rowID) => {
            return (
                <div key={rowID} className="about__box__body__row">
                    <div className="about__box__body__row__title">{state.aboutArticle.title}</div>
                    {
                        state.aboutArticle.content.map((item, i) => <div key={i}
                                                                         className="about__box__body__row__cont">{item}</div>)
                    }

                </div>
            );
        };

        return <ListView ref="lv"
                         dataSource={this.state.dataSource}
                         renderBodyComponent={() => <MyBody />}
                         renderRow={row}
                         className="about__box"
                         contentContainerStyle={{ height: '100%' }}
        />
    }
}

