import React from 'react';
import {render} from 'react-dom';

import ReactTable from 'react-table';


class AnnotationTable extends React.Component {
  constructor() {
    super();
    this.state = {
      data: [],
    };
    this.fetchData = this.fetchData.bind(this);
  }

  static columns = [
    {
      Header: '#',
      accessor: 'number',
      id: 'number',
      maxWidth: 40,
      resizeable: false,
    },
    {
      Header: I18n.t('filename'),
      id: 'filename',
      // TODO: refactor load_submitted_file_and_focus vs. load_submitted_file
      Cell: row => {
        let name;
        if (row.original.line_start !== undefined) {
          name = `${row.original.file} (line ${row.original.line_start})`;
        } else {
          name = row.original.file;
        }
        return (
          <a
            href="javascript:void(0)"
            onClick={() =>
              load_submitted_file_and_focus(
                row.original.submission_file_id,
                row.original.line_start)}>
              {name}
          </a>
        );
      },
      maxWidth: 150,
    },
    {
      Header: I18n.t('annotations.text'),
      accessor: 'content',
      Cell: data =>
        <div dangerouslySetInnerHTML={{__html: marked(data.value, {sanitize: true})}} />
    },
  ];

  static detailedColumns = [
    {
      Header: I18n.t('activerecord.attributes.annotation.creator'),
      accessor: 'creator',
      Cell: row => {
        if (row.original.is_remark) {
          return `${row.value} (${I18n.t('marker.annotation.remark_flag')})`;
        } else {
          return row.value;
        }
      },
      maxWidth: 120
    },
    {
      Header: I18n.t('activerecord.models.annotation_category', {count: 1}),
      accessor: 'annotation_category',
      maxWidth: 150,
    },
  ];

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    $.ajax({
      url: Routes.get_annotations_assignment_submission_result_path(
        this.props.assignment_id,
        this.props.submission_id,
        this.props.result_id),
      dataType: 'json',
    }).then(res => {
      this.setState({data: res});
    });
  }

  addAnnotation(annotation) {
    this.setState({data: this.state.data.concat([annotation])});
  }

  updateAnnotation(annotation) {
    // If the modified text was for a shared annotation, reload all annotations.
    // (This is pretty naive.)
    if (annotation.annotation_category !== '') {
      this.fetchData();
    } else {
      let newAnnotations = [...this.state.data];
      let i = newAnnotations.findIndex(a => a.id === annotation.id);
      if (i) {
        // Manually copy the annotation.
        newAnnotations[i] = {...newAnnotations[i]};
        newAnnotations[i].content = annotation.content;
        this.setState({data: newAnnotations});
      }
    }
  }

  destroyAnnotation(annotation_id) {
    let newAnnotations = [...this.state.data];
    let i = newAnnotations.findIndex(a => a.id === annotation_id);

    if (i) {
      newAnnotations.splice(i, 1);
      this.setState({data: newAnnotations});
    }
  }

  render() {
    const {data} = this.state;
    let allColumns = AnnotationTable.columns;
    if (this.props.detailed) {
      allColumns = allColumns.concat(AnnotationTable.detailedColumns);
    }

    return (
      <ReactTable
        data={data}
        columns={allColumns}
        filterable
        defaultSorted={[
          {id: 'filename'},
          {id: 'number'}
        ]}
      />
    );
  }
}


export function makeAnnotationTable(elem, props) {
  return render(<AnnotationTable {...props}/>, elem);
}