FactoryGirl.define do
  factory :user do
    ignore do
        member_in_project nil
        member_in_projects nil
        member_through_role nil
    end
    firstname 'Bob'
    lastname 'Bobbit'
    sequence(:login) { |n| "bob#{n}" }
    sequence(:mail) {|n| "bob#{n}.bobbit@bob.com" }
    password 'admin'
    password_confirmation 'admin'

    mail_notification(Redmine::VERSION::MAJOR > 0 ? 'all' : true)

    language 'en'
    status User::STATUS_ACTIVE
    admin false
    first_login false if User.table_exists? and User.columns.map(&:name).include? 'first_login'

    after(:create) do |user, evaluator|
      (projects = evaluator.member_in_projects || [])
      projects << evaluator.member_in_project if evaluator.member_in_project
      if !projects.empty?
        role = evaluator.member_through_role || FactoryGirl.build(:role, :permissions => [:view_issues, :edit_issues])
        projects.each do |p|
          if p
            p.add_member! user, role
          end
        end
      end
    end
  end

  factory :admin, :class => User do
    firstname 'Redmine'
    lastname 'Admin'
    login 'admin'
    password 'admin'
    password_confirmation 'admin'
    mail 'admin@example.com'
    admin true
    first_login false if User.table_exists? and User.columns.map(&:name).include? 'first_login'
  end

  factory :anonymous, :class => AnonymousUser do
    initialize_with { User.anonymous }
  end

  factory :deleted_user do
    status User::STATUS_BUILTIN
  end
end
