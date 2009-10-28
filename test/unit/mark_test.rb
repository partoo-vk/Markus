require File.dirname(__FILE__) + '/../test_helper'
require 'shoulda'

class MarkTest < ActiveSupport::TestCase
  fixtures :rubric_criteria, :results, :marks
  should_belong_to :rubric_criterion
  should_belong_to :result
  should_validate_presence_of :result_id, :rubric_criterion_id
  
  should_allow_values_for :mark, 0, 1, 2, 3, 4
  should_not_allow_values_for :mark, -2, -1, 5, 6

  should_allow_values_for :result_id, 1, 2, 3
  should_not_allow_values_for :result_id, -2, -1, 0

  should_allow_values_for :rubric_criterion_id, 1, 2, 3
  should_not_allow_values_for :rubric_criterion_id, -2, -1, 0

  should_validate_uniqueness_of :rubric_criterion_id, :scoped_to => :result_id
  
  def test_get_mark
     mark = marks(:mark_1)
     assert_equal(2, mark.get_mark)
  end

end
