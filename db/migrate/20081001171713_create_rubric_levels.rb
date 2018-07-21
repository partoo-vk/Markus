class CreateRubricLevels < ActiveRecord::Migration[4.2]
  extend MigrationHelpers
  def self.up
    create_table :rubric_levels do |t|
      t.column :rubric_criterion_id, :integer,  :null => false
      t.column :name,  :string, :null => false
      t.column :description,  :text
      t.column :level, :integer, :null => false
      t.timestamps
    end
    foreign_key(:rubric_levels, :rubric_criterion_id, :rubric_criteria)

  end

  def self.down
    drop_table :rubric_levels
  end
end
