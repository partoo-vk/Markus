import React from 'react';
import {render} from 'react-dom';

import {withSelection, CheckboxTable} from './markus_with_selection_hoc';


class GroupsManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      graders: [],
      students: [],
      loading: true
    }
  }

  componentDidMount() {
    this.fetchData();
    // TODO: Remove reliance on global modal
    $(document).ready(() => {
      $('#create_group_dialog form').on('ajax:success', () => {
        modalCreate.close();
        this.fetchData();
      });

      $('#rename_group_dialog form').on('ajax:success', () => {
        modal_rename.close();
        this.fetchData();
      });
    });
  }

  fetchData = () => {
    $.get({
      url: Routes.assignment_groups_path(this.props.assignment_id),
      dataType: 'json',
    }).then(res => {
      this.studentsTable.resetSelection();
      this.groupsTable.resetSelection();
      this.setState({
        groups: res.groups,
        students: res.students || [],
        loading: false,
      });
    });
  };

  createGroup = () => {
    if (this.props.group_name_autogenerated) {
      $.get({
        url: Routes.new_assignment_group_path(this.props.assignment_id)
      }).then(this.fetchData);
    } else {
      modalCreate.open();
      $('#new_group_name').val('');
    }
  };

  createAllGroups = () => {
    $.get({
      url: Routes.create_groups_when_students_work_alone_assignment_groups_path(this.props.assignment_id)
    }).then(this.fetchData);
  };

  deleteGroups = () => {
    let groupings = this.groupsTable.state.selection;
    if (groupings.length === 0) {
      alert(I18n.t('groups.select_a_group'));
      return;
    } else if (!confirm(I18n.t('groups.delete_confirm'))) {
      return;
    }

    $.ajax(Routes.remove_group_assignment_groups_path(this.props.assignment_id), {
      method: 'DELETE',
      data: {
        // TODO: change param to grouping_ids
        grouping_id: groupings
      }
    }).then(this.fetchData);
  };

  renameGroup = (grouping_id) => {
    $('#new_groupname').val('');
    $('#rename_group_dialog form').attr(
      'action',
      Routes.rename_group_assignment_group_path(this.props.assignment_id, grouping_id)
    );
    modal_rename.open();
  };

  unassign = (grouping_id, student_user_name) => {
    $.post({
      url: Routes.global_actions_assignment_groups_path(this.props.assignment_id),
      data: {
        global_actions: 'unassign',
        groupings: [grouping_id],
        students: [],  // Not necessary for 'unassign'
        students_to_remove: [student_user_name],
      }
    }).then(this.fetchData);
  };

  assign = () => {
    if (this.studentsTable.state.selection.length === 0) {
      alert(I18n.t('groups.select_a_student'));
      return;
    } else if (this.groupsTable.state.selection.length === 0) {
      alert(I18n.t('groups.select_a_group'));
      return;
    } else if (this.groupsTable.state.selection.length > 1) {
      alert(I18n.t('groups.select_only_one_group'));
      return;
    }

    let students = this.studentsTable.state.selection;
    let grouping_id = this.groupsTable.state.selection[0];

    $.post({
      url: Routes.global_actions_assignment_groups_path(this.props.assignment_id),
      data: {
        global_actions: 'assign',
        groupings: [grouping_id],
        students: students,
      }
    }).then(this.fetchData);
  };

  validate = (grouping_id) => {
    if (!confirm(I18n.t('groups.validate_confirm'))) {
      return;
    }

    $.get({
      url: Routes.valid_grouping_assignment_groups_path(this.props.assignment_id),
      data: {grouping_id: grouping_id}
    }).then(this.fetchData);
  };

  invalidate = (grouping_id) => {
    if (!confirm(I18n.t('groups.invalidate_confirm'))) {
      return;
    }

    $.get({
      url: Routes.invalid_grouping_assignment_groups_path(this.props.assignment_id),
      data: {grouping_id: grouping_id}
    }).then(this.fetchData);
  };

  render() {
    return (
      <div>
        <GroupsActionBox
          assign={this.assign}
          can_create_all_groups={this.props.can_create_all_groups}
          createAllGroups={this.createAllGroups}
          createGroup={this.createGroup}
          deleteGroups={this.deleteGroups}
        />
        <div className='mapping-tables'>
          <div className='mapping-table'>
            <StudentsTable
              ref={(r) => this.studentsTable = r}
              students={this.state.students} loading={this.state.loading}
            />
          </div>
          <div className='mapping-table'>
            <GroupsTable
              ref={(r) => this.groupsTable = r}
              groups={this.state.groups} loading={this.state.loading}
              unassign={this.unassign}
              renameGroup={this.renameGroup}
              groupMin={this.props.groupMin}
              validate={this.validate}
              invalidate={this.invalidate}
              scanned_exam={this.props.scanned_exam}
              assignment_id={this.props.assignment_id}
            />
          </div>
        </div>
      </div>
    );
  }
}


class RawGroupsTable extends React.Component {
  getColumns = () => [
    {
      show: false,
      accessor: 'id',
      id: '_id'
    },
    {
      Header: I18n.t('activerecord.models.groups.one'),
      accessor: 'group_name',
      id: 'group_name',
      Cell: row => {
        return (
          <span>
            <span
              className="rename-link"
              onClick={() => this.props.renameGroup(row.original._id)}
            />
            <span>{row.value}</span>
          </span>
        );
      }
    },
    {
      Header: I18n.t('members'),
      accessor: 'members',
      Cell: row => {
        if (row.value.length > 0 || !this.props.scanned_exam) {
          return row.value.map((member) => {
            let status;
            if (member[1] === 'pending') {
              status = <strong>({member[1]})</strong>;
            } else {
              status = `(${member[1]})`;
            }
            return <div key={`${row.original._id}-${member[0]}`} className='grader-row'>
              {member[0]} {status}
              <a href='#'
                 className="remove-icon"
                 onClick={() => this.props.unassign(row.original._id, member[0])}
                 title={I18n.t('remove')}
              />
            </div>;
          });
        } else {
          // Link to assigning a student to this scanned exam
          const assign_url = Routes.assign_scans_assignment_groups_path('', {
            assignment_id: this.props.assignment_id,
            grouping_id: row.original._id
          });
          return (
            <a href={assign_url}>{I18n.t('groups.assign_scans')}</a>
          );
        }
      },
      filterMethod: (filter, row) => {
        if (filter.value) {
          let flag = false;
          row._original.members.map (member => {
            if(member[0].includes(filter.value)){
              flag = true;
            }
          });
          
          return flag;

        } else {
          return true;
        }
      },
      sortable: false,
    },
    {
      Header: I18n.t('groups.valid'),
      Cell: row => {
        let isValid = row.original.admin_approved || row.original.members.length >= this.props.groupMin;
        if (isValid) {
          return (
            <div className="valid-icon"
                 title={I18n.t('groups.is_valid')}
                 onClick={() => this.props.invalidate(row.original._id)}
            />
          );
        } else {
          return (
            <div className="invalid-icon"
               title={I18n.t('groups.is_not_valid')}
               onClick={() => this.props.validate(row.original._id)}
            />
          );
        }
      },
      minWidth: 30,
      filterable: false,
      sortable: false
    },
  ];

  render() {
    return (
      <CheckboxTable
        ref={(r) => this.checkboxTable = r}

        data={this.props.groups}
        columns={this.getColumns()}
        defaultSorted={[
          {
            id: 'group_name'
          }
        ]}
        loading={this.props.loading}
        filterable

        {...this.props.getCheckboxProps()}
      />
    );
  }
}


class RawStudentsTable extends React.Component {
  getColumns = () => {
    return [
      {
        show: false,
        accessor: '_id',
        id: '_id'
      },
      {
        Header: I18n.t('activerecord.attributes.user.user_name'),
        accessor: 'user_name',
        id: 'user_name',
        minWidth: 90
      },
      {
        Header: I18n.t('activerecord.attributes.user.last_name'),
        accessor: 'last_name',
        id: 'last_name'
      },
      {
        Header: I18n.t('activerecord.attributes.user.first_name'),
        accessor: 'first_name',
        id: 'first_name'
      },
      {
        Header: I18n.t('groups.assigned_students') + '?',
        accessor: 'assigned',
        Cell: ({value}) => value ? '✔' : '',
        sortable: false,
        minWidth: 60,
        filterMethod: (filter, row) => {
          if (filter.value === 'all') {
            return true;
          } else { // Either 'true' or 'false'
            const assigned = filter.value === 'true';
            return row._original.assigned === assigned;
          }
        },
        Filter: ({ filter, onChange }) =>
          <select
            onChange={event => onChange(event.target.value)}
            style={{ width: '100%' }}
            value={filter ? filter.value : 'all'}
          >
            <option value='all'>{I18n.t('all')}</option>
            <option value='true'>{I18n.t('groups.assigned_students')}</option>
            <option value='false'>{I18n.t('groups.unassigned_students')}</option>
          </select>,
      }
    ];
  };

  render() {
    return (
      <CheckboxTable
        ref={(r) => this.checkboxTable = r}

        data={this.props.students}
        columns={this.getColumns()}
        defaultSorted={[
          {
            id: 'user_name'
          }
        ]}
        loading={this.props.loading}
        filterable

        {...this.props.getCheckboxProps()}
      />
    );
  }
}


const GroupsTable = withSelection(RawGroupsTable);
const StudentsTable = withSelection(RawStudentsTable);


class GroupsActionBox extends React.Component {
  render = () => {
    // TODO: 'icons/bin_closed.png' for Group deletion icon
    return (
      <div className='rt-action-box'>
        <button
          className=''
          onClick={this.props.assign}
        >
          {I18n.t('groups.add_to_group')}
        </button>
        {this.props.can_create_all_groups ? (
          <button
            className=''
            onClick={this.props.createAllGroups}
          >
            {I18n.t('groups.add_all_groups')}
          </button>
          ) : undefined}
        <button
          className=''
          onClick={this.props.createGroup}
        >
          {I18n.t('helpers.submit.create', {model: I18n.t('activerecord.models.groups.one')})}
        </button>
        <button
          className=''
          onClick={this.props.deleteGroups}
        >
          {I18n.t('groups.delete')}
        </button>
      </div>
    )
  };
}


export function makeGroupsManager(elem, props) {
  render(<GroupsManager {...props} />, elem);
}
