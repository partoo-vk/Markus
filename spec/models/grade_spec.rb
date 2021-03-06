describe Grade do

  it do
    is_expected.to validate_numericality_of(:grade)
  end

  it { should belong_to(:grade_entry_item) }
  it { should belong_to(:grade_entry_student) }

  it { should allow_value(0.0).for(:grade) }
  it { should allow_value(1.5).for(:grade) }
  it { should allow_value(100.0).for(:grade) }
  it { should_not allow_value(-0.5).for(:grade) }
  it { should_not allow_value(-1.0).for(:grade) }
  it { should_not allow_value(-100.0).for(:grade) }
end
